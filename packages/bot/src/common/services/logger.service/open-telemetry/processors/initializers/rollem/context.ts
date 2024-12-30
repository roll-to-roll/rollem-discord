import { Context, Attributes } from "@opentelemetry/api";
import { cloneDeep } from "lodash";
import { THROW } from "@common/errors/do-error";
import { RollemError } from "@common/errors";
import { RollemContextInterface } from "./context.interface";
import { OTel } from "@common/services/logger.service/open-telemetry/config";
import { LimitedCollection, Snowflake } from 'discord.js';

/** Rollem-specific context properties. A fresh context is created for each event chain. */
export class RollemContext {
  /** OTel key for {@link RollemContext}. */
  public static ROLLEM = OTel.api.createContextKey('djs-rollem');

  /** Stores a set of recent message IDs that have been replied to. */
  public static RecentMessageReplies = new LimitedCollection<Snowflake, boolean>({ maxSize: 100 });

  /** Returns true if this attribute set looks like it was loaded with a rollem context. */
  public static hasRollemContext(spanAttributes: Attributes): spanAttributes is { ['r.message']: Snowflake } {
    return !!spanAttributes['r.message'];
  }

  /** Returns True when the given span Attributes are in the list of recent replies. */
  public static isRecentlyReplied(spanAttributes: { ['r.message']: Snowflake } & Attributes) {
    const messageId = spanAttributes['r.message'];
    if (messageId) {
      return this.RecentMessageReplies.has(messageId);
    }

    return false;
  }

  constructor(
    /** Discord.js -related context */
    public readonly djs: RollemContextInterface,
  ) {}

  /** Marks the attached context as having a reply. */
  public markReplied() {
    if (!this.djs.message) { return; }
    this.djs.replied = true;
    RollemContext.RecentMessageReplies.set(this.djs.message, true);
  }

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