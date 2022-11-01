import type { MarshalDataObject, MarshalMarshalObject, MarshalStandardObject } from '../types';
import { MarshalContext, r_entry } from './r_helper';
import { r_ivar } from './r_ivar';
import { r_unique } from './r_symbol';
import { withSubContext, r_object } from './withSubContext';

export const marshalLoadObject = (context: MarshalContext) => {
  const path = withSubContext(context, false, r_unique);
  const object: MarshalStandardObject = r_entry(context, { __class: path });
  r_ivar(context, object);
  return object;
};

export const marshalLoadData = (context: MarshalContext) => {
  const path = withSubContext(context, false, r_unique);
  const object: MarshalDataObject = r_entry(context, { __class: path, __load_data: null });
  // Ruby calls _load_data with r so we'll extend the object itself with __load_data: r
  object.__load_data = r_object(context);
  return object;
};

export const marshalLoadUsrMarshal = (context: MarshalContext) => {
  const path = withSubContext(context, false, r_unique);
  const object: MarshalMarshalObject = r_entry(context, { __class: path, __marshal_load: null });
  // Ruby calls marshal_load with the given object so we set object.__marshal_load with that object
  object.__marshal_load = r_object(context);
  // Note: Not copying variables here, I'm not sure it's relevant for our case, correct me if I'm wrong
  return object;
};
