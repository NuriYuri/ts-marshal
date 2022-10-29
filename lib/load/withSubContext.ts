import { MarshalContext } from './r_helper';

export const withSubContext = <T>(context: MarshalContext, ivar: boolean, action: (subContext: MarshalContext) => T): T => {
  const subContext = { ...context, ivar };
  const object = action(subContext);
  context.index = subContext.index;
  return object;
};

export const r_object = (context: MarshalContext, ivar = false) => {
  return withSubContext(context, ivar, context.marshalLoad);
};
