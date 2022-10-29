import { MarshalError } from '../errors';
import { marshalLoadArray } from './array';
import { marshalLoadUserDef, marshalLoadString, marshalLoadRegexp, marshalLoadSymbol } from './encoded';
import { marshalLoadExtended } from './extended';
import { marshalLoadHash, marshalLoadHashDef } from './hash';
import { marshalLoadSymLink, marshalLoadLink } from './link';
import { marshalLoadModuleOld, marshalLoadClass, marshalLoadModule } from './modules';
import { marshalLoadObject, marshalLoadData, marshalLoadUsrMarshal } from './objects';
import { marshalLoadFixnum, marshalLoadFloat, marshalLoadBigNum } from './primitives';
import { MarshalContext, r_byte } from './r_helper';
import { marshalLoadIvar } from './r_ivar';
import { marshalLoadStruct } from './struct';
import { marshalLoadUClass } from './uclass';

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

  const context: MarshalContext = { buffer, index: 2, symbols: [], objects: [], ivar: false, marshalLoad };
  return marshalLoad(context);
};
