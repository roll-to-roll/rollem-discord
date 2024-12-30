import { defaults } from "lodash";

export interface RollemErrorOptions<T = unknown> {
  name?: string;

  message: string;

  cause?: unknown;

  context?: T;
}

export class RollemError<TContext = unknown> extends Error {
  /** Freeform context object attached by the original thrower. */
  public context?: TContext;

  constructor(params: RollemErrorOptions<TContext>, original?: RollemErrorOptions<TContext>) {
    const o = defaults({}, params, original);
    super(o.message, o);
    this.context = o.context;
    this.name = o.name ?? this.constructor.name;
  }
}