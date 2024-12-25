/** Any type that news up to the given type. */
export type Newable<T> = new (...t: any[]) => T;