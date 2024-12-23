import { Logger } from "@bot/logger";
import { HandlerType, PromLogger } from "@bot/prom-logger";
import { BehaviorContext } from "@common/behavior-context";
import { BehaviorResponse } from "@common/behavior-response";
import { BehaviorBase, Trigger } from "@common/behavior.base";
import { Injectable } from "injection-js";

/** A ping-pong behavior for simple testing. */
@Injectable()
export class PingPongBehavior extends BehaviorBase {
  public label = 'ping-pong';

  constructor(
    promLogger: PromLogger,
    logger: Logger,
  ) {
    super(promLogger, logger);
  }

  public async onPrefixMissing(trigger: Trigger, content: string, context: BehaviorContext): Promise<BehaviorResponse | null> {
    return null;
  }

  public async onDirectPing(trigger: Trigger, content: string, context: BehaviorContext): Promise<BehaviorResponse | null> {
    if (content.startsWith('ping')) {
      this.promLogger.incHandlersUsed(HandlerType.PingPong);
      return {
        response: "pong",
      };
    } else {
      return null;
    }
  }

  public async onPrefixProvidedOrNotRequired(trigger: Trigger, content: string, context: BehaviorContext): Promise<BehaviorResponse | null> {
    return null;
  }
}