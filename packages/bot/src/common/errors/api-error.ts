import { RollemError, RollemErrorOptions } from "./error";

export class RollemApiError<TContext> extends RollemError<TContext> {
  constructor(params: RollemErrorOptions<TContext>, original?: RollemErrorOptions<TContext>) {
    super(params, original);
  }
}