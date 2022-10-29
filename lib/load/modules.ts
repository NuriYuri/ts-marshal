import type { MarshalClassObject, MarshalModuleObject, MarshalModuleOrClassObject } from '../types';
import { MarshalContext, r_bytes, r_entry } from './r_helper';

export const marshalLoadModuleOld = (context: MarshalContext): MarshalModuleOrClassObject => {
  const name = r_bytes(context).toString('utf-8');
  return r_entry(context, { __class: 'ModuleOrClass', name });
};

export const marshalLoadClass = (context: MarshalContext): MarshalClassObject => {
  const name = r_bytes(context).toString('utf-8');
  return r_entry(context, { __class: 'Class', name });
};

export const marshalLoadModule = (context: MarshalContext): MarshalModuleObject => {
  const name = r_bytes(context).toString('utf-8');
  return r_entry(context, { __class: 'Module', name });
};
