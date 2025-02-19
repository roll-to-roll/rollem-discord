import { OriginalConfig } from "@root/platform/original-config.service";
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
 * Parses messages that do not mention the bot.
 */
@Injectable()
export class DiceSoftParseBehavior extends DiceBehaviorBase {
  public label = "dice-soft-parse";

  constructor(
    parsers: Parsers,
    config: OriginalConfig,
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
    return null;
  }

  public async onPrefixProvidedOrNotRequired(
    trigger: Trigger,
    content: string,
    context: BehaviorContext
  ): Promise<BehaviorResponse | null> {
    return this.onAllHandled(trigger, content, context);
  }

  private async onAllHandled(
    trigger: Trigger,
    content: string,
    context: BehaviorContext
  ): Promise<BehaviorResponse | null> {
    // apparently D8 is a common emote, so avoid responding to that
    if (content.startsWith("D")) {
      return null;
    }

    const requireDice = true;
    const lines = this.roll(content, this.label, content, context, requireDice);
    return await this.makeReplyAndLog(content, this.label, RollHandlerSubtype.SoftParse, lines);
  }
}