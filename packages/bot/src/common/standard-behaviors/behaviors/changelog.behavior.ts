import { ChangeLog } from "@common/services/changelog/changelog";
import { Logger } from "@common/services/logger.service/logger.service";
import { HandlerType, PromLogger } from "@common/services/prom-logger.service/prom-logger.service";
import { BehaviorContext } from "@common/standard-behaviors/types/behavior-context";
import { BehaviorResponse } from "@common/standard-behaviors/types/behavior-response";
import { BehaviorBase, Trigger } from "@common/standard-behaviors/behavior.base";
import { Injectable } from "injection-js";

/** A behavior that dumps the changelog. */
@Injectable()
export class ChangelogBehavior extends BehaviorBase {
  public label = 'changelog';

  constructor(
    private readonly changelog: ChangeLog,
    promLogger: PromLogger,
    logger: Logger,
  ) {
    super(promLogger, logger);
  }

  public async onPrefixMissing(trigger: Trigger, content: string, context: BehaviorContext): Promise<BehaviorResponse | null> {
    return null;
  }

  public async onDirectPing(trigger: Trigger, content: string, context: BehaviorContext): Promise<BehaviorResponse | null> {
    if (content.startsWith('changelog') ||
      content.startsWith('change log') ||
      content.startsWith('changes') ||
      content.startsWith('diff')
    ) {
      this.promLogger.incHandlersUsed(HandlerType.Changelog);
      return {
        response: this.changelog.changelog,
      };
    } else {
      return null;
    }
  }

  public async onPrefixProvidedOrNotRequired(trigger: Trigger, content: string, context: BehaviorContext): Promise<BehaviorResponse | null> {
    return null;
  }
}