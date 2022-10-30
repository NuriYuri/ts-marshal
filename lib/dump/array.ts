import { MarshalObject } from '../types';
import { MarshalDumpContext, w_byte, w_long, w_remember } from './r_helpers';

export const marshalDumpArray = (context: MarshalDumpContext, object: MarshalObject[]) => {
  w_remember(context, object);
  w_byte(context, 91);
  w_long(context, object.length);
  object.forEach((value) => context.marshalDump(context, value));
};
