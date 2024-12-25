import { Logger } from "@common/services/logger.service/logger.service";
import { HandlerType, PromLogger } from "@common/services/prom-logger.service/prom-logger.service";
import { BehaviorContext } from "@common/standard-behaviors/types/behavior-context";
import { BehaviorResponse } from "@common/standard-behaviors/types/behavior-response";
import { BehaviorBase, Trigger } from "@common/standard-behaviors/behavior.base";
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