import { Config } from "@root/platform/discord/rollem-bot/config";
import { Parsers } from "@root/platform/discord/rollem-bot/lib/parsers";
import { RollemRandomSources } from "@root/platform/discord/rollem-bot/lib/rollem-random-sources";
import { Logger, LoggerCategory } from "@root/platform/discord/rollem-bot/logger";
import { HandlerType, PromLogger, RollHandlerSubtype } from "@common/prom-logger";
import { BehaviorContext } from "@common/standard-behaviors/types/behavior-context";
import { BehaviorResponse } from "@common/standard-behaviors/types/behavior-response";
import { Trigger } from "@common/standard-behaviors/behavior.base";
import { Injectable } from "injection-js";
import _ from "lodash";
import { DiceBehaviorBase } from "./dice.behavior.base";

/**
 * Parses `[inline rolls]`
 */
@Injectable()
export class DiceBracketedBehavior extends DiceBehaviorBase {
  public label = "dice-bracketed";

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

  public async onPrefixProvidedOrNotRequired(
    trigger: Trigger,
    content: string,
    context: BehaviorContext
  ): Promise<BehaviorResponse | null> {
    return this.onAll(trigger, content, context);
  }

  private async onAll(
    trigger: Trigger,
    content: string,
    context: BehaviorContext
  ): Promise<BehaviorResponse | null> {
    // handle inline matches
    let last: RegExpExecArray | null = null;
    let matches: string[] = [];
    let regex = /\[(.+?)\]/g;
    while ((last = regex.exec(content))) {
      matches.push(last[1]);
    }

    if (matches && matches.length > 0) {
      this.logger.trackMessageEvent(
        LoggerCategory.BehaviorEvent,
        `${this.label} (parent): [${matches.join("], [")}]`,
        trigger
      );
      let lines = _(matches)
        .map((match) => {
          let hasPrefix = true;
          let requireDice = true;
          let lines = this.roll(
            trigger,
            this.label,
            match,
            context,
            requireDice
          );
          return lines;
        })
        .filter((x) => x != null)
        .map((x) => x || [])
        .flatten()
        .value();

      if (lines.length === 0) {
        return null;
      }
      
      return await this.makeReplyAndLog(trigger, this.label, RollHandlerSubtype.Bracketed, lines);
    }

    return null;
  }
}