import { Logger } from "@common/services/logger.service/logger.service";
import { PromLogger } from "@common/services/prom-logger.service/prom-logger.service";
import { Message } from "discord.js";
import { Injectable, InjectionToken } from "injection-js";
import { BehaviorContext } from "./types/behavior-context";
import { BehaviorResponse } from "./types/behavior-response";

/** The event that initiated this action. */
export type Trigger = Message | any;

/** A Base Behavior. */
@Injectable()
export abstract class BehaviorBase {
  constructor(
    protected readonly promLogger: PromLogger,
    protected readonly logger: Logger,
  ) { }

  /** The label for this behavior. Used in logging. */
  public abstract get label(): string;

  /** Called when the no prefix was provided. */
  public abstract onPrefixMissing(trigger: Trigger, content: string, context: BehaviorContext): Promise<BehaviorResponse | null>;

  /** Called when the message has been Soft Prefixed (required prefix was provided and stripped from the content) */
  public abstract onPrefixProvidedOrNotRequired(trigger: Trigger, content: string, context: BehaviorContext): Promise<BehaviorResponse | null>;

  /** Called when the message has been prefixed by an @botname ping */
  public abstract onDirectPing(trigger: Trigger, content: string, context: BehaviorContext): Promise<BehaviorResponse | null>;
}
