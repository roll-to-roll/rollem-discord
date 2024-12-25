import { Config } from "@bot/discord-config.service";
import { Parsers } from "@common/services/parsers.service";
import { RollemRandomSources } from "@bot/lib/rollem-random-sources.service";
import { Logger } from "@common/services/logger.service/logger.service";
import { PromLogger, RollHandlerSubtype } from "@common/services/prom-logger.service/prom-logger.service";
import { BehaviorContext } from "@common/standard-behaviors/types/behavior-context";
import { BehaviorResponse } from "@common/standard-behaviors/types/behavior-response";
import { Trigger } from "@common/standard-behaviors/behavior.base";
import { Injectable } from "injection-js";
import _ from "lodash";
import { DiceBehaviorBase } from "./dice.behavior.base";

/**
 * Parses messages that mention the bot.
 */
@Injectable()
export class DiceTaggedBehavior extends DiceBehaviorBase {
  public label = "dice-tagged";

  constructor(
    parsers: Parsers,
    config: Config,
    rng: RollemRandomSources,
    promLogger: PromLogger,
    logger: Logger
  ) {
    super(parsers, config, rng, promLogger, logger);
  }

  public async onPrefixMissing(
    trigger: Trigger,
    content: string,
    context: BehaviorContext
  ): Promise<BehaviorResponse | null> {
    return null;
  }

  public async onDirectPing(
    trigger: Trigger,
    content: string,
    context: BehaviorContext
  ): Promise<BehaviorResponse | null> {
    let requireDice = false;
    var lines = this.roll(trigger, this.label, content, context, requireDice);
    return await this.makeReplyAndLog(trigger, this.label, RollHandlerSubtype.Tagged, lines);
  }

  public async onPrefixProvidedOrNotRequired(
    trigger: Trigger,
    content: string,
    context: BehaviorContext
  ): Promise<BehaviorResponse | null> {
    return null;
  }
}