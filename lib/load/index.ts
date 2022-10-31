import { MarshalError } from '../errors';
import type { MarshalObject } from '../types';
import { marshalLoadArray } from './array';
import { marshalLoadUserDef, marshalLoadString, marshalLoadRegexp, marshalLoadSymbol } from './encoded';
import { marshalLoadExtended } from './extended';
import { marshalLoadHash, marshalLoadHashDef } from './hash';
import { marshalLoadSymLink, marshalLoadLink } from './link';
import { marshalLoadModuleOld, marshalLoadClass, marshalLoadModule } from './modules';
import { marshalLoadObject, marshalLoadData, marshalLoadUsrMarshal } from './objects';
import { marshalLoadFixnum, marshalLoadFloat, marshalLoadBigNum } from './primitives';
import { MarshalContext, r_byte, r_leave } from './r_helper';
import { marshalLoadIvar } from './r_ivar';
import { marshalLoadStruct } from './struct';
import { marshalLoadUClass } from './uclass';

const marshalLoad = (context: MarshalContext): MarshalObject => {
  const type = r_byte(context);
  switch (type) {
    case 48: // TYPE_NIL '0'
      return r_leave(context, null);
    case 84: // TYPE_TRUE 'T'
      return r_leave(context, true);
    case 70: // TYPE_FALSE 'F'
      return r_leave(context, false);
    case 105: // TYPE_FIXNUM 'i'
      return r_leave(context, marshalLoadFixnum(context));
    case 101: // TYPE_EXTENDED 'e'
      return marshalLoadExtended(context); // No r_leave here as in ruby
    case 67: // TYPE_UCLASS 'C'
      return marshalLoadUClass(context); // No r_leave here as in ruby
    case 111: // TYPE_OBJECT 'o'
      return r_leave(context, marshalLoadObject(context));
    case 100: // TYPE_DATA 'd'
      return r_leave(context, marshalLoadData(context));
    case 117: // TYPE_USERDEF 'u'
      return r_leave(context, marshalLoadUserDef(context));
    case 85: // TYPE_USRMARSHAL 'U'
      return r_leave(context, marshalLoadUsrMarshal(context));
    case 102: // TYPE_FLOAT 'f'
      return r_leave(context, marshalLoadFloat(context));
    case 108: // TYPE_BIGNUM 'l'
      return r_leave(context, marshalLoadBigNum(context));
    case 34: // TYPE_STRING '"'
      return r_leave(context, marshalLoadString(context));
    case 47: // TYPE_REGEXP '/'
      return r_leave(context, marshalLoadRegexp(context));
    case 91: // TYPE_ARRAY '['
      return r_leave(context, marshalLoadArray(context));
    case 123: // TYPE_HASH '{'
      return r_leave(context, marshalLoadHash(context));
    case 125: // TYPE_HASH_DEF '}'
      return r_leave(context, marshalLoadHashDef(context));
    case 83: // TYPE_STRUCT 'S'
      return r_leave(context, marshalLoadStruct(context));
    case 77: // TYPE_MODULE_OLD 'M'
      return r_leave(context, marshalLoadModuleOld(context));
    case 99: // TYPE_CLASS 'c'
      return r_leave(context, marshalLoadClass(context));
    case 109: // TYPE_MODULE 'm'
      return r_leave(context, marshalLoadModule(context));
    case 58: // TYPE_SYMBOL ':'
      return r_leave(context, marshalLoadSymbol(context));
    case 59: // TYPE_SYMLINK ';'
      return marshalLoadSymLink(context); // No r_leave as in Ruby
    case 73: // TYPE_IVAR 'I'
      return marshalLoadIvar(context);
    case 64: // TYPE_LINK '@'
      return r_leave(context, marshalLoadLink(context)); // For some reason link triggers the block again
    default:
      throw new MarshalError(`dump format error(0x${context.buffer.toString('hex', context.index - 1, context.index)})`);
  }
};

export const load = (buffer: Buffer, map?: MarshalContext['map']): MarshalObject => {
  if (!buffer || buffer.length < 3) throw new MarshalError('marshal data too short'); // Smallest Marshal buffer is of size 3

  // Check version
  const major = buffer.readUInt8(0);
  const minor = buffer.readUInt8(1);
  if (major !== 4 && minor !== 8) throw new MarshalError(`format version 4.8 required; ${major}.${minor} given`);

  const context: MarshalContext = { buffer, index: 2, symbols: [], objects: [], ivar: false, marshalLoad, map };
  return marshalLoad(context);
};
