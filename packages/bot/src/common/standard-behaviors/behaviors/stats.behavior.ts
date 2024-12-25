import { ChangeLog } from "@root/platform/discord/rollem-bot/changelog";
import { Logger } from "@root/platform/discord/rollem-bot/logger";
import { HandlerType, PromLogger } from "@common/prom-logger";
import { BehaviorContext } from "@common/standard-behaviors/types/behavior-context";
import { BehaviorResponse } from "@common/standard-behaviors/types/behavior-response";
import { BehaviorBase, Trigger } from "@common/standard-behaviors/behavior.base";
import { BehaviorStatsBase } from "@common/standard-behaviors/stats-base";
import { Injectable } from "injection-js";
import { toPairs } from "lodash";

/** A behavior that dumps some stats and info about the current bot. */
@Injectable()
export class StatsBehavior extends BehaviorBase {
  constructor(
    private readonly statsProvider: BehaviorStatsBase,
    promLogger: PromLogger,
    logger: Logger,
  ) {
    super(promLogger, logger);
  }

  public label = "stats";
  
  public async onPrefixMissing(trigger: Trigger, content: string, context: BehaviorContext): Promise<BehaviorResponse | null> {
    return null;
  }

  public async onDirectPing(trigger: Trigger, content: string, context: BehaviorContext): Promise<BehaviorResponse | null> {
    if (content.startsWith('stats') || content.startsWith('help')) {
      const stats = await this.statsProvider.getStats();
      const statsPairs = toPairs(stats);
      const statsArray = statsPairs.map(([name, value]) => `**${name}:** ${value}`);
      const contentArray = [
        '',
        ...statsArray,
        '',
        '- Docs at <http://rollem.rocks>',
        '- Try `@rollem changelog`',
        '- v2 syntax is in the works',
        '',
        "Fund rollem's server addiction:",
        '- <https://patreon.com/david_does>',
        '- <https://ko-fi.com/rollem>',
        '',
        'Avatar by Kagura on Charisma Bonus.'
      ];
      const response = contentArray.join('\n');

      this.promLogger.incHandlersUsed(HandlerType.Stats);
      
      return {
        response: response,
      };
    } else {
      return null;
    }
  }

  public async onPrefixProvidedOrNotRequired(trigger: Trigger, content: string, context: BehaviorContext): Promise<BehaviorResponse | null> {
    return null;
  }
}
