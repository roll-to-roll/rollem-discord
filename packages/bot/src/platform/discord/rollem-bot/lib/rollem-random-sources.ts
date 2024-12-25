import { CsprngRandomSource } from "@rollem/language";
import { Injectable } from "injection-js";

/** Sources of randomness Rollem is able to use. */
@Injectable()
export class RollemRandomSources {
  /** A cryptographically secure source of randomness. */
  public readonly csprng = new CsprngRandomSource();
}