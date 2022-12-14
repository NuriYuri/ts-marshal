import { MarshalError } from '../errors';
import type { MarshalObject } from '../types';
import { MarshalContext, r_long } from './r_helper';

export const marshalLoadLink = (context: MarshalContext) => {
  const index = r_long(context);
  if (index > context.objects.length) throw new MarshalError('dump format error (unlinked)');
  return context.objects[index] as MarshalObject;
};

export const marshalLoadSymLink = (context: MarshalContext) => {
  const index = r_long(context);
  if (index >= context.symbols.length) throw new MarshalError('bad symbol');
  return context.symbols[index];
};
