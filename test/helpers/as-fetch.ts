export const asFetch = <T extends typeof fetch>(fn: T): typeof fetch =>
  fn as unknown as typeof fetch;
