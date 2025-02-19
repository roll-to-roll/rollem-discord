import { RollemError } from "@common/errors/error";

export function THROW<T extends RollemError>(error: T): never {
  throw error;
}