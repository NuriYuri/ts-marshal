import { MarshalError } from '../errors';
import { MarshalObject } from '../types';
import { marshalLoadModule } from './modules';
import { MarshalContext, r_byte } from './r_helper';
import { r_unique } from './r_symbol';
import { withSubContext } from './withSubContext';

export const marshalLoadExtended = (context: MarshalContext, extMod: ReturnType<typeof marshalLoadModule>[] = []): MarshalObject => {
  const path = withSubContext(context, false, r_unique);
  const name = Symbol.keyFor(path);
  if (!name) throw new MarshalError(`${path.toString()} is unknown to the JS realm.`);

  extMod.push({ __class: 'Module', name });
  const type = r_byte(context);
  // TYPE_EXTENDED 'e'
  if (type === 101) {
    return marshalLoadExtended(context, extMod);
  } else {
    context.index -= 1;
    const object = context.marshalLoad(context);
    // TODO: use guard clause for typed objects
    // Note: in JS we can't extend strings, floats, bigInt etc... with modules
    if (typeof object === 'object' && object != null) {
      (object as Record<string, unknown>).__extendedModules = extMod;
    }
    return object;
  }
};
