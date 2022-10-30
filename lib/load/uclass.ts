import { MarshalError } from '../errors';
import type { MarshalObject } from '../types';
import { MarshalContext } from './r_helper';
import { r_unique } from './r_symbol';
import { withSubContext, r_object } from './withSubContext';

export const marshalLoadUClass = (context: MarshalContext): MarshalObject => {
  const path = withSubContext(context, false, r_unique);

  const object = r_object(context);
  if (['bigint', 'number', 'string'].includes(typeof object)) return object; // Not supported by JS
  if (typeof object !== 'object' || object === null) throw new MarshalError('dump format error (user class)');
  if (['Class', 'Module', 'ModuleOrClass'].includes((object as Record<string, string>).__class))
    throw new MarshalError('dump format error (user class)');
  (object as Record<string, Symbol>).__class = path; // That's junky but I don't believe it might even end here
  return object;
};
