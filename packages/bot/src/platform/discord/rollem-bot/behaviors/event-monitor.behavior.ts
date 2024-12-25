import { DiscordBehaviorBase } from "./discord.behavior.base";
import util, { promisify } from "util";
import { Client, Message, User, MessageReaction, ClientEvents } from "discord.js";
import { Logger, LoggerCategory } from "@common/services/logger.service/logger.service";
import { Injectable } from "injection-js";
import { PromLogger } from "@common/services/prom-logger.service/prom-logger.service";

interface AdditionalMetrics {
  guildId?: string;
  userCount?: number;
}

/**
 * Counts seen events with PromLogger.
 */
@Injectable()
export class EventMonitorBehavior extends DiscordBehaviorBase {
  userCountGauge: any;
  constructor(
    client: Client,
    promLogger: PromLogger,
    logger: Logger,
  ) { super(client, promLogger, logger); }

  protected async register() {
    this.logOn('messageCreate');
    this.logOn('messageUpdate');
    this.logOn('typingStart');
    // this.logOn('typingStop');
    this.logOn('presenceUpdate');
    this.logOn('userUpdate');
    // this.logOn("debug", function(info){
    //     console.log(`debug -> ${info}`);
    // });
    this.logOn('messageReactionAdd');
    this.logOn('messageReactionRemove');
    this.logOn('messageReactionRemoveAll');
    this.logOn('guildUnavailable');
    this.logOn('voiceStateUpdate');
    this.logOn('warn');

    this.client.on('rateLimit', info => {
      if (info && typeof info.path == 'string' && info.path.includes('reactions')) {
        return;
      }
      this.logDiscordActivity('rateLimit');
      this.logger.trackSimpleEvent(LoggerCategory.SystemEvent, 'RateLimit', info)
    });
  }
  
  private logOn<K extends keyof ClientEvents>(event: K) {
    this.client.on(event, (...args: ClientEvents[K]) => this.doLogging(event, ...args))
  }

  private async doLogging<K extends keyof ClientEvents>(event: K, ...args: ClientEvents[K]) {
    const additionalMetrics = await this.extractAdditionalMetrics(event, ...args) ?? undefined;
    this.logDiscordActivity(event, additionalMetrics);
  }

  private async extractAdditionalMetrics<K extends keyof ClientEvents>(event: K, ...args: ClientEvents[K]): Promise<AdditionalMetrics | null> {
    switch (event) {
      case 'messageCreate':
        const [messageCreate] = args as ClientEvents['messageCreate'];
        return {
          guildId: messageCreate.guildId ?? 'DM',
        };
      case 'messageUpdate':
        const [messageUpdate] = args as ClientEvents['messageUpdate'];
        return {
          guildId: messageUpdate.guildId ?? 'DM',
        };
      case 'typingStart':
        const [typing] = args as ClientEvents['typingStart'];
        return {
          guildId: typing?.guild?.id ?? 'DM',
        };
      case 'presenceUpdate':
        const [presenceUpdate] = args as ClientEvents['presenceUpdate'];
        return {
          guildId: presenceUpdate?.guild?.id ?? 'DM',
        };
      case 'userUpdate':
        const [userUpdate] = args as ClientEvents['userUpdate'];
        return { };
      case 'messageReactionAdd':
        const [messageReactionAdd] = args as ClientEvents['messageReactionAdd'];
        return {
          guildId: messageReactionAdd.message.guildId ?? 'DM',
        };
      case 'messageReactionRemove':
        const [messageReactionRemove] = args as ClientEvents['messageReactionRemove'];
        return {
          guildId: messageReactionRemove?.message?.guildId ?? 'DM',
        };
      case 'messageReactionRemoveAll':
        const [messageReactionRemoveAll] = args as ClientEvents['messageReactionRemoveAll'];
        return {
          guildId: messageReactionRemoveAll?.guildId ?? 'DM',
        };
      case 'guildUnavailable':
        const [guildUnavailable] = args as ClientEvents['guildUnavailable'];
        return {
          guildId: guildUnavailable?.id ?? 'DM',
        };
      case 'voiceStateUpdate':
        const [voiceStateUpdate] = args as ClientEvents['voiceStateUpdate'];
        return {
          guildId: voiceStateUpdate?.guild?.id ?? 'DM',
        };
    }

    return null;
  }

  private logDiscordActivity(activity: string, additionalMetrics?: AdditionalMetrics) {
    this.promLogger.incEventsProcessed({
      activity,
      ...additionalMetrics,
    });
  }
}