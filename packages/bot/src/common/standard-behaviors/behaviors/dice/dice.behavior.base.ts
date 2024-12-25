import { Config } from "@root/platform/discord/rollem-bot/config";
import { Parsers } from "@root/platform/discord/rollem-bot/lib/parsers";
import { RollemRandomSources } from "@root/platform/discord/rollem-bot/lib/rollem-random-sources";
import { Logger, LoggerCategory } from "@root/platform/discord/rollem-bot/logger";
import { HandlerType, ParserRollType, PromLogger, RollHandlerSubtype } from "@common/prom-logger";
import { BehaviorContext, isKnownPrefix } from "@common/standard-behaviors/types/behavior-context";
import { BehaviorResponse } from "@common/standard-behaviors/types/behavior-response";
import { BehaviorBase, Trigger } from "@common/standard-behaviors/behavior.base";
import { ContainerV1, OldContainer } from "@rollem/language";
import { Injectable } from "injection-js";
import _, { chain, chunk } from "lodash";

/** A behavior that rolls dice. */
@Injectable()
export abstract class DiceBehaviorBase extends BehaviorBase {
  constructor(
    protected readonly parsers: Parsers,
    protected readonly config: Config,
    protected readonly rng: RollemRandomSources,
    promLogger: PromLogger,
    logger: Logger,
  ) {
    super(promLogger, logger);
  }

  /**
   * Attempts to roll many dice from the given content
   * @returns The response message(s) or null
   */
  protected roll(trigger: Trigger, logTag: string, content: string, context: BehaviorContext, requireDice: boolean): string[] | null {
    try {
      switch(context.roleConfiguredOptions.whichParser) {
        case 'v2': 
          return this.rollV2(trigger, logTag, content, context, requireDice);
        case 'v1-beta':
          return this.rollV1Beta(trigger, logTag, content, context, requireDice);
        case 'v1':
        default:
          return this.rollV1(trigger, logTag, content, context, requireDice);
      }
    } catch (ex) {
      this.logger.trackMessageError(LoggerCategory.BehaviorEvent, `Roll Many, ${logTag}: ${content}`, trigger);
      throw ex;
    }
  }

  protected rollV2(trigger: Trigger, logTag: string, content: string, context: BehaviorContext, requireDice: boolean): string[] | null {
    let count = 1;
    const match = content.match(/(?:(\d+)#\s*)?(.*)/);
    const countRaw = match ? match[1] : false;
    if (countRaw) {
      count = parseInt(countRaw, 10);
      if (count > 100) { return null; }
      if (count < 1) { return null; }
    }

    count = count || 1;
    const contentAfterCount = match ? match[2] : content;

    const lines: string[] = [];
    for (let i = 0; i < count; i++) {
      const result = this.parsers.v2.tryParse(contentAfterCount);
      if (!result) { return null; }

      const hasPrefix = isKnownPrefix(context.messageConfiguredOptions?.prefixStyle);
      const result2 = result({ randomSource: this.rng.csprng, hello: "hello", trace: () => {} });
      const shouldReply = hasPrefix || (result2.depth() > 1 && result2.dice() > 0); // don't be too aggressive with the replies
      if (!shouldReply) { return null; }

      const response = this.buildMessageV2(result2);

      if (response && shouldReply) {
        lines.push(response);
      }
    }

    if (lines.length > 0) {
      if (count > 1) {
        this.promLogger.incParserUse(ParserRollType.ManyInBulk, 'v2');
      } else {
        this.promLogger.incParserUse(ParserRollType.Many, 'v2');
      }
      this.logger.trackMessageEvent(LoggerCategory.BehaviorEvent, `Roll Many v2, ${logTag}: ${content}`, trigger);
    }

    return lines;
  }

  protected rollV1Beta(trigger: Trigger, logTag: string, content: string, context: BehaviorContext, requireDice: boolean): string[] | null {
    let count = 1;
    const match = content.match(/(?:(\d+)#\s*)?(.*)/);
    const countRaw = match ? match[1] : false;
    if (countRaw) {
      count = parseInt(countRaw, 10);
      if (count > 100) { return null; }
      if (count < 1) { return null; }
    }

    count = count || 1;
    const contentAfterCount = match ? match[2] : content;

    const lines: string[] = [];
    for (let i = 0; i < count; i++) {
      const result = this.parsers.v1beta.tryParse(contentAfterCount);
      if (!result) { return null; }

      const hasPrefix = isKnownPrefix(context.messageConfiguredOptions?.prefixStyle);
      const shouldReply = hasPrefix || (result.depth > 1 && result.dice > 0); // don't be too aggressive with the replies
      if (!shouldReply) { return null; }

      const response = this.buildMessage(result, requireDice);

      if (response && shouldReply) {
        lines.push(response);
      }
    }

    if (lines.length > 0) {
      if (count > 1) {
        this.promLogger.incParserUse(ParserRollType.ManyInBulk, 'v1-beta');
      } else {
        this.promLogger.incParserUse(ParserRollType.Many, 'v1-beta');
      }
      this.logger.trackMessageEvent(LoggerCategory.BehaviorEvent, `Roll Many v1-beta, ${logTag}: ${content}`, trigger);
    }

    return lines;
  }

  protected rollV1(trigger: Trigger, logTag: string, content: string, context: BehaviorContext, requireDice: boolean): string[] | null {
    
    const rollSpoileredResults = this.rollSpoileredV1(trigger, logTag, content, context, requireDice);
    if ((rollSpoileredResults?.length ?? 0) > 0) {
      return rollSpoileredResults;
    }

    const rollManyResults = this.rollManyV1(trigger, logTag, content, context, requireDice);
    if ((rollManyResults?.length ?? 0) > 0) {
      return rollManyResults;
    }


    const rollGroupedResults = this.rollGroupedV1(trigger, logTag, content, context, requireDice);
    if ((rollGroupedResults?.length ?? 0) > 0) {
      return rollGroupedResults;
    }

    const rollOneEngineResults = this.rollFortuneV1(trigger, logTag, content, context, requireDice);
    if ((rollOneEngineResults?.length ?? 0) > 0) {
      return rollOneEngineResults;
    }

    return null;
  }



  protected rollSpoileredV1(trigger: Trigger, logTag: string, content: string, context: BehaviorContext, requireDice: boolean): string[] | null {
    const match = content.match(/^([sS]#)(?:(\d+)#\s*)?(.*)/i);

    if (!match) {
      return null;
    }
    const diceWithoutSpoiler = match[3] ? match[3] : content;


    const lines: string[] = [];
    const result = this.parsers.v1.tryParse(diceWithoutSpoiler);
    if (!result) { return null; }

    // don't be too aggressive with the replies
    const hasEnoughDice = requireDice ? result.dice > 0 : true;
    const hasPrefix = isKnownPrefix(context.messageConfiguredOptions?.prefixStyle);
    const shouldReply = hasPrefix || (result.depth > 1 && hasEnoughDice);
    if (!shouldReply) { return null; }

    const response = this.buildMessage(result, requireDice);

    if (response && shouldReply) {
      lines.push("||" + response + "||");
    }
      this.promLogger.incParserUse(ParserRollType.Spoilered, 'v1');
      this.logger.trackMessageEvent(LoggerCategory.BehaviorEvent, `Roll Spoilered v1, ${logTag}: ${content}`, trigger);
      return lines;
    }




  protected rollFortuneV1(trigger: Trigger, logTag: string, content: string, context: BehaviorContext, requireDice: boolean): string[] | null {
    const match = content.match(/(?:fortune#\s*)?(.*)/i);
    if (!match) {
      return null;
    }

    const contentAfterCount = match[1];
    const result = this.parsers.v1.tryParse(contentAfterCount);
    if (!result) { return null; }

    // don't be too aggressive with the replies
    const hasEnoughDice = requireDice ? result.dice > 0 : true;
    const hasPrefix = isKnownPrefix(context.messageConfiguredOptions?.prefixStyle);
    const shouldReply = hasPrefix || (result.depth > 1 && hasEnoughDice);
    if (!shouldReply) { return null; }

    const headerLine = this.buildMessage(result, requireDice);
    if (!headerLine) { return null; }

    function makeOreTag(count: number): string {
      switch (count) {
        case 1:
          return '';
        case 2:
          return ' - Basic Success';
        case 3:
          return ' - Critical Success';
        case 4:
          return ' - Extreme Success';
        case 5:
          return ' - Impossible Success';
        default:
          return ' - IMPOSSIBLE Success';
      }
    }

    const groupedValues =
      chain(result.values)
      .groupBy()
      .entries()
      .flatMap(([key, values]) => {
        const chunked = chunk(values, 5);
        console.log(chunked);
        return chunked.map(chunkSize => ({ value: key, count: chunkSize.length}));
      })
      .sortBy(group => group.count, group => group.value)
      .reverse()
      .map(group => `${group.count}x ${group.value} ${makeOreTag(group.count)}`)
      .value();

      this.promLogger.incParserUse(ParserRollType.Fortune, 'v1');
    this.logger.trackMessageEvent(LoggerCategory.BehaviorEvent, `Roll Fortune v1, ${logTag}: ${content}`, trigger);

    return [
      headerLine,
      ...groupedValues,
    ];
  }



  protected rollGroupedV1(trigger: Trigger, logTag: string, content: string, context: BehaviorContext, requireDice: boolean): string[] | null {
    const match = content.match(/(?:(ore|group|groupValue|groupCount|groupSize|groupHeight|groupWidth)#\s*)?(.*)/i);
    if (!(match && match[1])) {
      return null;
    }

    const groupType = match[1].toLowerCase() as 'group' | 'groupValue' | 'groupCount' | 'groupSize' | 'groupHeight' | 'groupWidth' | 'ore';
    const contentAfterCount = match[2];
    const result = this.parsers.v1.tryParse(contentAfterCount);
    if (!result) { return null; }

    // don't be too aggressive with the replies
    const hasEnoughDice = requireDice ? result.dice > 0 : true;
    const hasPrefix = isKnownPrefix(context.messageConfiguredOptions?.prefixStyle);
    const shouldReply = hasPrefix || (result.depth > 1 && hasEnoughDice);
    if (!shouldReply) { return null; }

    const headerLine = this.buildMessage(result, requireDice);
    if (!headerLine) { return null; }

    const groupedValues =
      chain(result.values)
      .groupBy()
      .entries()
      .map(([key, values]) => ({ value: key, count: values.length }));

    let sortedGroupedValues = groupedValues;
    switch (groupType) {
      case 'ore':
      case 'group':
      case 'groupValue':
      case 'groupHeight':
        sortedGroupedValues = groupedValues.sortBy(group => group.value).reverse();
        break;
      case 'groupSize':
      case 'groupCount':
      case 'groupWidth':
        sortedGroupedValues = groupedValues.sortBy(group => group.count).reverse();
        break;
    }
    const groupedValueLines = groupedValues.map(group => `${group.count}x ${group.value}`).value();

    this.promLogger.incParserUse(ParserRollType.Grouped, 'v1');
    this.logger.trackMessageEvent(LoggerCategory.BehaviorEvent, `Roll Grouped v1, ${logTag}: ${content}`, trigger);

    return [
      headerLine,
      ...groupedValueLines,
    ];
  }

  protected rollManyV1(trigger: Trigger, logTag: string, content: string, context: BehaviorContext, requireDice: boolean): string[] | null {
    let count = 1;
    const match = content.match(/(?:(\d+)#\s*)?(.*)/);
    const countRaw = match ? match[1] : false;
    if (countRaw) {
      count = parseInt(countRaw, 10);
      if (count > 100) { return null; }
      if (count < 1) { return null; }
    }

    count = count || 1;
    const contentAfterCount = match ? match[2] : content;

    const lines: string[] = [];
    for (let i = 0; i < count; i++) {
      const result = this.parsers.v1.tryParse(contentAfterCount);
      if (!result) { return null; }

      // don't be too aggressive with the replies
      const hasEnoughDice = requireDice ? result.dice > 0 : true;
      const hasPrefix = isKnownPrefix(context.messageConfiguredOptions?.prefixStyle);
      const shouldReply = hasPrefix || (result.depth > 1 && hasEnoughDice);
      if (!shouldReply) { return null; }

      const response = this.buildMessage(result, requireDice);

      if (response && shouldReply) {
        lines.push(response);
      }
    }

    if (lines.length > 0) {
      if (count > 1) {
        this.promLogger.incParserUse(ParserRollType.ManyInBulk, 'v1');
      } else {
        this.promLogger.incParserUse(ParserRollType.Many, 'v1');
      }
      this.logger.trackMessageEvent(LoggerCategory.BehaviorEvent, `Roll Many v1, ${logTag}: ${content}`, trigger);
    }

    return lines;
  }

  protected buildMessageV2(result: OldContainer) {
    if (!result) { return false; }

    let response = "";

    // if (result.label && result.label !== "") {
    //   response += "'" + result.label + "', ";
    // }

    //spacing out along with a nice formatting of the role number. 
    response += '` ' + result.value + ' `' + ' ⟵ ' + result.pretties.split(']').join('] ');

    return response;
  }

  protected buildMessage(result: ContainerV1 | false, requireDice = true) {
    if (result === false) { return false; }
    if (result.error) { return result.error; }
    if (result.depth <= 1) { return false; }
    if (requireDice && result.dice < 1) { return false; }

    let response = "";

    if (result.label && result.label !== "") {
      response += "'" + result.label + "', ";
    }

    if (typeof (result.value) === "boolean") {
      // special case for boolean results
      result.value = result.value ? "**Success!**" : "**Failure!**";
      response += result.value + ' ⟵ ' + result.pretties.split(']').join('] ');
    } else {
      //spacing out along with a nice formatting of the role number, for all other results
      response += '` ' + result.value + ' `' + ' ⟵ ' + result.pretties.split(']').join('] ');
    }

    return response;
  }

  /** 
   * Produces a reply to the message.
   * @param logTag The tag for this log path.
   * @param lines The grouped replies, or null.
   * @returns True if a response was sent.
   */
  protected async makeReplyAndLog(
    trigger: Trigger,
    logTag: string,
    handlerSubtype: RollHandlerSubtype,
    lines: string[] | null
  ): Promise<BehaviorResponse | null> {
    if (lines && lines.length > 0) {
      this.promLogger.incHandlersUsed(HandlerType.Roll, handlerSubtype);

      const response = "\n" + lines.join("\n");

      return {
        response,
      };
    }

    return null;
  }
}