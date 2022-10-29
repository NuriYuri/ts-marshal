export class MarshalError extends Error {}

type MarshalContext = {
  readonly buffer: Buffer;
  index: number;
  symbols: symbol[];
  objects: unknown[];
  ivar: boolean;
};

const r_byte = (context: MarshalContext): number => {
  return context.buffer.readUint8(context.index++);
};

// More or less equivalent to r_long
const marshalLoadFixnum = (context: MarshalContext): number => {
  const c = context.buffer.readInt8(context.index++);
  if (c === 0) return 0;
  if (c > 0) {
    if (4 < c && c < 128) return c - 5;
    if (c > 8) throw new MarshalError(`long too big for this architecture (size 8), given ${c}`);
    let x = 0;
    for (let i = 0; i < c; i++) x |= r_byte(context) << (8 * i);
    return x;
  }
  if (-129 < c && c < -4) return c + 5;
  const m = -c;
  if (m > 8) throw new MarshalError(`long too big for this architecture (size 8), given ${m}`);
  let x = -1;
  for (let i = 0; i < m; i++) {
    x &= ~(0xff << (8 * i));
    x |= r_byte(context) << (8 * i);
  }
  return x;
};
const r_long = marshalLoadFixnum;

const r_bytes = (context: MarshalContext): Buffer => {
  const length = r_long(context);
  if (length < 0) throw new MarshalError(`Negative length are not allowed for buffer, given length: ${length}`);
  const buffer = context.buffer.slice(context.index, context.index + length);
  context.index += length;
  return buffer;
};

const r_entry = <T>(context: MarshalContext, object: T): T => {
  context.objects.push(object);
  return object;
};

const marshalLoadString = (context: MarshalContext): string => {
  const string = r_entry(context, r_bytes(context).toString('utf-8'));
  if (context.ivar) {
    withSubContext(context, false, discardEncoding);
    context.ivar = false;
  }
  return string;
};

const marshalLoadFloat = (context: MarshalContext): number => {
  const floatData = r_bytes(context).toString('binary');
  // if (floatData === 'nan') return r_entry(context, NaN); // Number('nan') => NaN
  if (floatData === 'inf') return r_entry(context, Infinity);
  if (floatData === '-inf') return r_entry(context, -Infinity);
  return Number(floatData);
};

const marshalLoadBigNum = (context: MarshalContext): BigInt => {
  const sign = r_byte(context);
  const length = r_long(context);
  if (length < 0) throw new MarshalError(`Negative length are not allowed for buffer, given length: ${length}`);
  const data = context.buffer.slice(context.index, context.index + length * 2);
  context.index += length * 2;
  const value = BigInt(`0x${data.reverse().toString('hex')}`);
  if (sign === 45) return r_entry(context, -value);
  return r_entry(context, value);
};

const withSubContext = <T>(context: MarshalContext, ivar: boolean, action: (subContext: MarshalContext) => T): T => {
  const subContext = { ...context, ivar };
  const object = action(subContext);
  context.index = subContext.index;
  return object;
};

const r_object = (context: MarshalContext, ivar = false) => {
  return withSubContext(context, ivar, (subContext) => marshalLoad(subContext));
};

const discardEncoding = (context: MarshalContext) => {
  let num = r_long(context);
  while (num-- > 0) {
    r_symbol(context);
    r_object(context);
  } // TODO: handle encoding later
};

const marshalLoadSymbol = (context: MarshalContext): symbol => {
  const symbol = Symbol.for(r_bytes(context).toString('utf-8'));
  context.symbols.push(symbol);
  if (context.ivar) {
    withSubContext(context, false, discardEncoding);
    context.ivar = false;
  }
  return symbol;
};

const marshalLoadSymLink = (context: MarshalContext): symbol => {
  const index = r_long(context);
  if (index >= context.symbols.length) throw new MarshalError('bad symbol');
  return context.symbols[index];
};

const marshalLoadModuleOld = (context: MarshalContext) => {
  const name = r_bytes(context).toString('utf-8');
  return r_entry(context, { __class: 'ModuleOrClass' as const, name });
};

const marshalLoadClass = (context: MarshalContext) => {
  const name = r_bytes(context).toString('utf-8');
  return r_entry(context, { __class: 'Class' as const, name });
};

const marshalLoadModule = (context: MarshalContext) => {
  const name = r_bytes(context).toString('utf-8');
  return r_entry(context, { __class: 'Module' as const, name });
};

const marshalLoadLink = (context: MarshalContext) => {
  const index = r_long(context);
  if (index > context.objects.length) throw new MarshalError('dump format error (unlinked)');
  return context.objects[index];
};

const r_symbol = (context: MarshalContext): symbol => {
  const type = r_byte(context);
  switch (type) {
    case 73: // TYPE_IVAR 'I'
      return withSubContext(context, true, (subContext) => r_symbol(subContext));
    case 58: // TYPE_SYMBOL ':'
      return marshalLoadSymbol(context);
    case 59: // TYPE_SYMLINK ';'
      return marshalLoadSymLink(context);
    default:
      throw new MarshalError(`dump format error for symbol(0x${context.buffer.toString('hex', context.index - 1, context.index)})`);
  }
};
const r_unique = r_symbol;

const marshalLoadExtended = (context: MarshalContext, extMod: ReturnType<typeof marshalLoadModule>[] = []): unknown => {
  const path = withSubContext(context, false, (subContext) => r_unique(subContext));
  const name = Symbol.keyFor(path);
  if (!name) throw new MarshalError(`${path.toString()} is unknown to the JS realm.`);

  extMod.push({ __class: 'Module', name });
  const type = r_byte(context);
  // TYPE_EXTENDED 'e'
  if (type === 101) {
    return marshalLoadExtended(context, extMod);
  } else {
    context.index -= 1;
    const object = marshalLoad(context);
    // Note: in JS we can't extend strings, floats, bigInt etc... with modules
    if (typeof object === 'object' && object != null) {
      (object as Record<string, unknown>).__extendedModules = extMod;
    }
    return object;
  }
};

const marshalLoadUClass = (context: MarshalContext): unknown => {
  const path = withSubContext(context, false, (subContext) => r_unique(subContext));

  const object = r_object(context);
  if (['bigint', 'number', 'string'].includes(typeof object)) return object; // Not supported by JS
  if (typeof object !== 'object' || object === null) throw new MarshalError('dump format error (user class)');
  if (['Class', 'Module', 'ModuleOrClass'].includes((object as Record<string, string>).__class))
    throw new MarshalError('dump format error (user class)');
  (object as Record<string, Symbol>).__class = path; // That's junky but I don't believe it might even end here
  return object;
};

const r_ivar = (context: MarshalContext, object: Record<string, unknown>) => {
  let length = r_long(context);
  if (length < 0) throw new MarshalError(`Negative length are not allowed for IVAR, given length: ${length}`);
  if (length === 0) return;

  // How to scare a front-end developer with one keyword
  do {
    const sym = r_symbol(context);
    const field = Symbol.keyFor(sym);
    if (!field) throw new MarshalError(`${sym.toString()} is unknown to the JS realm.`);
    const val = r_object(context);
    // Note we're skipping the encoding stuff because it shouldn't be called with regexp or symbols
    object[field] = val;
  } while (--length > 0);
};

const marshalLoadObject = (context: MarshalContext): Record<string, unknown> => {
  const path = withSubContext(context, false, (subContext) => r_unique(subContext));
  const object = r_entry(context, { __class: path });
  r_ivar(context, object);
  return object;
};

const marshalLoadData = (context: MarshalContext): Record<string, unknown> => {
  const path = withSubContext(context, false, (subContext) => r_unique(subContext));
  const object = r_entry(context, { __class: path } as Record<string, unknown>);
  const r = r_object(context);
  // Ruby calls _load_data with r so we'll extend the object itself with __load_data: r
  object.__load_data = r;
  return object;
};

const marshalLoadUserDef = (context: MarshalContext): Record<string, unknown> => {
  const path = withSubContext(context, false, (subContext) => r_unique(subContext));
  const object = r_entry(context, { __class: path } as Record<string, unknown>);
  // Ruby calls _load with the given buffer so we set object.__load with that buffer
  object.__load = r_bytes(context);
  if (context.ivar) {
    withSubContext(context, false, discardEncoding);
    context.ivar = false;
  }
  return object;
};

const marshalLoadUsrMarshal = (context: MarshalContext): Record<string, unknown> => {
  const path = withSubContext(context, false, (subContext) => r_unique(subContext));
  const object = r_entry(context, { __class: path } as Record<string, unknown>);
  const data = r_object(context);
  // Ruby calls marshal_load with the given buffer so we set object.__marshal_load with that buffer
  object.__marshal_load = data;
  // Note: Not copying variables here, I'm not sure it's relevant for our case, correct me if I'm wrong
  return object;
};

const marshalLoadStruct = (context: MarshalContext): Record<string, unknown> => {
  const path = withSubContext(context, false, (subContext) => r_unique(subContext));
  let length = r_long(context);
  if (length < 0) throw new MarshalError(`Negative length are not allowed for structs, given length: ${length}`);
  const struct = r_entry(context, { __class: path, __type: 'Struct' } as Record<string, unknown>);
  while (length--) {
    const slot = r_symbol(context);
    const field = Symbol.keyFor(slot);
    if (!field) throw new MarshalError(`${slot.toString()} is unknown to the JS realm.`);
    struct[field] = r_object(context);
  }
  return struct;
};

const marshalLoadRegexp = (context: MarshalContext): RegExp => {
  const raw = r_bytes(context);
  const options = r_byte(context); // 0 = none, 1 = i, 4 = m, 2 = x
  const flags = [undefined, 'i', undefined, 'i', 'm', 'mi', 'm', 'mi'][options & 0x07]; // Note: x is not supported in JS
  const regexp = r_entry(context, new RegExp(raw.toString('utf-8'), flags));
  if (context.ivar) {
    withSubContext(context, false, discardEncoding);
    context.ivar = false;
  }
  return regexp;
};

const marshalLoadArray = (context: MarshalContext): unknown[] => {
  let length = r_long(context);
  if (length < 0) throw new MarshalError(`Negative length are not allowed for array, given length: ${length}`);
  const array = r_entry(context, [] as unknown[]);
  while (length--) array.push(r_object(context));
  return array;
};

const marshalLoadHash = (context: MarshalContext) => {
  let length = r_long(context);
  if (length < 0) throw new MarshalError(`Negative length are not allowed for hashes, given length: ${length}`);
  const hash = r_entry(context, { __class: 'Hash' } as Record<string | symbol, unknown>);
  while (length--) {
    const key = r_object(context);
    const value = r_object(context);
    if (typeof key !== 'string' && typeof key !== 'symbol') {
      throw new MarshalError(`Cannot support non symbol or string key in Hashes in JS, received: ${typeof key}`);
    }
    hash[key] = value;
  }
  return hash;
};

const marshalLoadHashDef = (context: MarshalContext) => {
  const hash = marshalLoadHash(context);
  hash.__default = r_object(context);
  return hash;
};

const marshalLoadIvar = (context: MarshalContext) => {
  return withSubContext(context, true, (subContext) => {
    const object = marshalLoad(subContext);
    // Not converted to guard clause for now because iVar also affect strings, regexp etc... and we need to look it up
    if (subContext.ivar) {
      if (typeof object === 'object' && object !== null) {
        withSubContext(subContext, false, (ivarContext) => r_ivar(ivarContext, object as Record<string, unknown>));
      }
    }
    return object;
  });
};

const marshalLoad = (context: MarshalContext): unknown => {
  const type = r_byte(context);
  switch (type) {
    case 48: // TYPE_NIL '0'
      return null;
    case 84: // TYPE_TRUE 'T'
      return true;
    case 70: // TYPE_FALSE 'F'
      return false;
    case 105: // TYPE_FIXNUM 'i'
      return marshalLoadFixnum(context);
    case 101: // TYPE_EXTENDED 'e'
      return marshalLoadExtended(context);
    case 67: // TYPE_UCLASS 'C'
      return marshalLoadUClass(context);
    case 111: // TYPE_OBJECT 'o'
      return marshalLoadObject(context);
    case 100: // TYPE_DATA 'd'
      return marshalLoadData(context);
    case 117: // TYPE_USERDEF 'u'
      return marshalLoadUserDef(context);
    case 85: // TYPE_USRMARSHAL 'U'
      return marshalLoadUsrMarshal(context);
    case 102: // TYPE_FLOAT 'f'
      return marshalLoadFloat(context);
    case 108: // TYPE_BIGNUM 'l'
      return marshalLoadBigNum(context);
    case 34: // TYPE_STRING '"'
      return marshalLoadString(context);
    case 47: // TYPE_REGEXP '/'
      return marshalLoadRegexp(context);
    case 91: // TYPE_ARRAY '['
      return marshalLoadArray(context);
    case 123: // TYPE_HASH '{'
      return marshalLoadHash(context);
    case 125: // TYPE_HASH_DEF '}'
      return marshalLoadHashDef(context);
    case 83: // TYPE_STRUCT 'S'
      return marshalLoadStruct(context);
    case 77: // TYPE_MODULE_OLD 'M'
      return marshalLoadModuleOld(context);
    case 99: // TYPE_CLASS 'c'
      return marshalLoadClass(context);
    case 109: // TYPE_MODULE 'm'
      return marshalLoadModule(context);
    case 58: // TYPE_SYMBOL ':'
      return marshalLoadSymbol(context);
    case 59: // TYPE_SYMLINK ';'
      return marshalLoadSymLink(context);
    case 73: // TYPE_IVAR 'I'
      return marshalLoadIvar(context);
    case 64: // TYPE_LINK '@'
      return marshalLoadLink(context);
    default:
      throw new MarshalError(`dump format error(0x${context.buffer.toString('hex', context.index - 1, context.index)})`);
  }
};

export const load = (buffer: Buffer): unknown => {
  if (!buffer || buffer.length < 3) throw new MarshalError('marshal data too short'); // Smallest Marshal buffer is of size 3

  // Check version
  const major = buffer.readUInt8(0);
  const minor = buffer.readUInt8(1);
  if (major !== 4 && minor !== 8) throw new MarshalError(`format version 4.8 required; ${major}.${minor} given`);

  const context: MarshalContext = { buffer, index: 2, symbols: [], objects: [], ivar: false };
  return marshalLoad(context);
};
