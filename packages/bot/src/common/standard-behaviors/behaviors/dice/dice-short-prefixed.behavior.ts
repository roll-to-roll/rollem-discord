import { Config } from "@root/platform/discord/rollem-bot/config";
import { Parsers } from "@root/platform/discord/rollem-bot/lib/parsers";
import { RollemRandomSources } from "@root/platform/discord/rollem-bot/lib/rollem-random-sources";
import { Logger } from "@root/platform/discord/rollem-bot/logger";
import { HandlerType, PromLogger, RollHandlerSubtype } from "@common/prom-logger";
import { BehaviorContext } from "@common/standard-behaviors/types/behavior-context";
import { BehaviorResponse } from "@common/standard-behaviors/types/behavior-response";
import { Trigger } from "@common/standard-behaviors/behavior.base";
import { Injectable } from "injection-js";
import _ from "lodash";
import { DiceBehaviorBase } from "./dice.behavior.base";

/**
 * Parses things with the following prefixes:
 *  - &
 *  - r
 */
@Injectable()
export class DiceShortPrefixedBehavior extends DiceBehaviorBase {
  public label = "dice-short-prefix";

  constructor(
    parsers: Parsers,
    config: Config,
    rng: RollemRandomSources,
    promLogger: PromLogger,
    logger: Logger
  ) {
    super(parsers, config, rng, promLogger, logger);
  }

  public onPrefixMissing(
    trigger: Trigger,
    content: string,
    context: BehaviorContext
  ): Promise<BehaviorResponse | null> {
    return this.onAll(trigger, content, context);
  }

  public onDirectPing(
    trigger: Trigger,
    content: string,
    context: BehaviorContext
  ): Promise<BehaviorResponse | null> {
    return this.onAll(trigger, content, context);
  }

  public onPrefixProvidedOrNotRequired(
    trigger: Trigger,
    content: string,
    context: BehaviorContext
  ): Promise<BehaviorResponse | null> {
    return this.onAll(trigger, content, context);
  }

  public async onAll(
    trigger: Trigger,
    content: string,
    context: BehaviorContext
  ): Promise<BehaviorResponse | null> {
    if (content.startsWith("r") || content.startsWith("&")) {
      let subMessage = content.substring(1);
      let requireDice = false;
      let lines = this.roll(
        trigger,
        `${this.label} (${content[0]})`,
        subMessage,
        context,
        requireDice
      );
      return await this.makeReplyAndLog(
        trigger,
        `${this.label} (${content[0]})`,
        RollHandlerSubtype.ShortPrefixed,
        lines
      );
    }

    return null;
  }
}