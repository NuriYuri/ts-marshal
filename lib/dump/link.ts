import { MarshalDumpContext, w_byte, w_long } from './r_helpers';

export const marshalDumpObjectLink = (context: MarshalDumpContext, object: unknown) => {
  w_byte(context, 64);
  w_long(context, context.objects.indexOf(object));
};

export const marshalDumpSymbolLink = (context: MarshalDumpContext, symbol: symbol) => {
  w_byte(context, 59);
  w_long(context, context.symbols.indexOf(symbol));
};
