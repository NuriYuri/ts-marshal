export type MarshalClassObject = {
  __class: 'Class';
  name: string;
};

export type MarshalModuleObject = {
  __class: 'Module';
  name: string;
};

export type MarshalModuleOrClassObject = {
  __class: 'ModuleOrClass';
  name: string;
};

export type MarshalHash = {
  __class: 'Hash';
  __default?: MarshalObject;
  __extendedModules?: MarshalModuleObject[];
} & Record<string | symbol, unknown>;

export type MarshalStandardObject = {
  __class: symbol;
  __extendedModules?: MarshalModuleObject[];
} & Record<string, unknown>;

export type MarshalMarshalObject = {
  __class: symbol;
  __marshal_load: MarshalObject;
};

export type MarshalUserObject = {
  __class: symbol;
  __load: Buffer;
  __encoding?: BufferEncoding;
};

export type MarshalDataObject = {
  __class: symbol;
  __load_data: MarshalObject;
};

export type MarshalStructObject = {
  __class: symbol;
  __type: 'Struct';
  __extendedModules?: MarshalModuleObject[];
} & Record<string, unknown>;

export type MarshalExtendableObject = MarshalStructObject | MarshalHash | MarshalStandardObject;

export type MarshalObject =
  | null
  | true
  | false
  | number
  | symbol
  | string
  | bigint
  | RegExp
  | MarshalModuleOrClassObject
  | MarshalClassObject
  | MarshalModuleObject
  | MarshalDataObject
  | MarshalMarshalObject
  | MarshalUserObject
  | MarshalHash
  | MarshalStructObject
  | MarshalStandardObject
  | MarshalObject[]
  | Map<MarshalObject, MarshalObject>;
