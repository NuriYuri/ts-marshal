import type {
  MarshalClassObject,
  MarshalExtendableObject,
  MarshalHash,
  MarshalMarshalObject,
  MarshalModuleObject,
  MarshalModuleOrClassObject,
  MarshalStandardObject,
  MarshalStructObject,
  MarshalUserObject,
} from './types';

const isRecord = (object: unknown): object is Record<string | symbol, unknown> => typeof object === 'object' && object !== null;

export const isMarshalExtendableObject = (object: unknown): object is MarshalExtendableObject =>
  isRecord(object) && (typeof object.__class === 'symbol' || object.__class === 'Hash') && !('__marshal_load' in object) && !('__load' in object);

export const isMarshalClassObject = (object: unknown): object is MarshalClassObject => isRecord(object) && object.__class === 'Class';

export const isMarshalModuleObject = (object: unknown): object is MarshalModuleObject => isRecord(object) && object.__class === 'Module';

export const isMarshalModuleOrClassObject = (object: unknown): object is MarshalModuleOrClassObject =>
  isRecord(object) && object.__class === 'ModuleOrClass';

export const isMarshalHash = (object: unknown): object is MarshalHash => isRecord(object) && object.__class === 'Hash';

export const isMarshalStandardObject = (object: unknown): object is MarshalStandardObject =>
  isRecord(object) && typeof object.__class === 'symbol' && !('__marshal_load' in object) && !('__load' in object) && !('__type' in object);

export const isMarshalMarshalObject = (object: unknown): object is MarshalMarshalObject =>
  isRecord(object) && '__marshal_load' in object && typeof object.__class === 'symbol';

export const isMarshalUserObject = (object: unknown): object is MarshalUserObject =>
  isRecord(object) && '__load' in object && typeof object.__class === 'symbol';

export const isMarshalStructObject = (object: unknown): object is MarshalStructObject =>
  isRecord(object) && typeof object.__class === 'symbol' && object.__type === 'Struct';
