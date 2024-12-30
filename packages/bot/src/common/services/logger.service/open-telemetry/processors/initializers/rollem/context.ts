import { Context} from "@opentelemetry/api";
import { cloneDeep } from "lodash";
import { THROW } from "@common/errors/do-error";
import { RollemError } from "@common/errors";
import { RollemContextInterface } from "./context.interface";
import { OTel } from "@common/services/logger.service/open-telemetry/config";

/** Rollem-specific context properties. A fresh context is created for each event chain. */
export class RollemContext {
  /** OTel key for {@link RollemContext}. */
  public static ROLLEM = OTel.api.createContextKey('djs-rollem');

  constructor(
    /** Discord.js -related context */
    public readonly djs: RollemContextInterface,
  ) {}

  /** Type guard for Rollem Context. */
  public static isRollemContext(item: unknown): item is RollemContext {
    if (typeof item !== 'object') return false;
    if (item instanceof RollemContext) { return true; }
    return false;
  }

  /** Overwrites the current {@link RollemContext} with a new one. */
  public static set(initialVals: RollemContextInterface, context: Context = OTel.api.context.active()): Context {
    return context.setValue(this.ROLLEM, new RollemContext(cloneDeep(initialVals)));
  }

  /** Retrieves the current {@link RollemContext}, if it exists. */
  public static get(context: Context = OTel.api.context.active()): RollemContext | undefined{
    const result = context.getValue(this.ROLLEM);
    if (this.isRollemContext(result)) { return result; }
    return undefined;
  } 

  /** Retrieves the current {@link RollemContext} or throws. */
  public static getOrThrow(context: Context = OTel.api.context.active()): RollemContext {
    return this.get(context) || THROW(new RollemError({ message: "Could not retrieve RollemContext", context }));
  } 
}