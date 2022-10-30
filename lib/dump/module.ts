import { MarshalClassObject, MarshalModuleObject, MarshalModuleOrClassObject } from '../types';
import { MarshalDumpContext, w_byte, w_bytes, w_remember } from './r_helpers';

export const marshalDumpModuleOld = (context: MarshalDumpContext, object: MarshalModuleOrClassObject) => {
  w_remember(context, object);
  w_byte(context, 77);
  w_bytes(context, Buffer.from(object.name, 'utf8'));
};

export const marshalDumpClass = (context: MarshalDumpContext, object: MarshalClassObject) => {
  w_remember(context, object);
  w_byte(context, 99);
  w_bytes(context, Buffer.from(object.name, 'utf8'));
};

export const marshalDumpModule = (context: MarshalDumpContext, object: MarshalModuleObject) => {
  w_remember(context, object);
  w_byte(context, 109);
  w_bytes(context, Buffer.from(object.name, 'utf8'));
};
