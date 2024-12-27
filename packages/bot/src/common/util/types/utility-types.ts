/** Any type that news up to the given type. */
export type Newable<T> = new (...t: any[]) => T;

/** Refers to a class type.  */
export type Class<T> = Function & { prototype: T }