import { DiscordBehaviorBase } from "./discord.behavior.base";
import util, { promisify } from "util";
import { Client, Message, User, MessageReaction } from "discord.js";
import { Logger, LoggerCategory } from "@common/services/logger.service/logger.service";
import { Injectable } from "injection-js";
import { PromLogger } from "@common/services/prom-logger.service/prom-logger.service";
import { OriginalConfig } from "@root/platform/original-config.service";
import { DiscordClientService } from "@root/platform/discord/client/discord-client.service";
import { ENV_CONFIG } from "@root/platform/env-config.service";

// TODO: there's got to be a cleaner way to handle this, but this seems to make it more resilient.

/**
 * Causes this client to die when a disconnect event occurs.
 * When supervised, the process should be immediately restarted.
 */
@Injectable()
export class DeadmanSwitchBehavior extends DiscordBehaviorBase {
  private static readonly TimeWindowDuration = 60 * 1000;
  private static readonly PollingDuration = 30 * 1000;

  constructor(
    client: DiscordClientService,
    promLogger: PromLogger,
    logger: Logger,
    private readonly config: OriginalConfig
  ) { super(client, promLogger, logger); }

  private activityInLastMinute = 0;
  private messagesSinceLastReport = 0;

  protected async register() {
    this.client.on('messageCreate', m => {
      this.messagesSinceLastReport++;
      this.logDiscordActivity();
    });

    // this.client.on('typingStart', () => this.logDiscordActivity());
    // this.client.on('typingStop', () => this.logDiscordActivity());
    // this.client.on('presenceUpdate', () => this.logDiscordActivity());
    // this.client.on('userUpdate', () => this.logDiscordActivity());
    // this.client.on("debug", function(info){
    //     console.log(`debug -> ${info}`);
    // });
    // this.client.on('messageReactionAdd', (reaction, user) => this.logDiscordActivity());
    // this.client.on('messageReactionRemove', (reaction, user) => this.logDiscordActivity());
    // this.client.on('messageReactionRemoveAll', (message) => this.logDiscordActivity());
    // this.client.on('voiceStateUpdate', (oldMember, newMember) => this.logDiscordActivity());

    this.client.on('messageUpdate', (oldMessage, newMessage) => this.logDiscordActivity());
    this.client.on('guildUnavailable', guild => {
      this.logger.trackError(LoggerCategory.SystemEvent, `Guild Unvailable (id: ${guild.id})`);
      this.logDiscordActivity();
    });

    this.client.on('warn', info => this.logger.trackError(LoggerCategory.SystemEvent, "warning - " + info));
    this.client.on('rateLimit', info => {
      if (info && typeof info.path == 'string' && info.path.includes('reactions')) {
        return;
      }
      
      this.logger.trackSimpleEvent(LoggerCategory.SystemEvent, 'RateLimit', info)
    });

    await this.initializeSelfWatchdog();

    setInterval(() => this.watch(), DeadmanSwitchBehavior.PollingDuration);
  }

  /** Generates messages on startup and then twiddles the emoji on them, ensuring there's always activity. */
  private async initializeSelfWatchdog() {
    let botOwner: User | undefined = undefined;
    let message: Message | undefined = undefined;
    let reaction: MessageReaction | undefined = undefined;
    let counter = 0;
    this.client.on('ready', async () => {
      message = undefined;
      reaction = undefined;
      counter++;
      while (!message) {
        try {
          botOwner = await this.client.users.fetch("105641015943135232"); // this is me. i couldn't message the bot itself.
          const diagnosticMode = this.config.inLocalDiagnosticMode ? "__**`[DIAGNOSTIC]`**__ " : "";
          message = await botOwner.send(`${diagnosticMode}shard '${ENV_CONFIG.shardSetInfo.name}' - ready ${counter}`) as Message;
        } catch {
          await promisify(setTimeout)(DeadmanSwitchBehavior.TimeWindowDuration / 3);
        }
      }
    });

    //// this was generating a lot of logs, costing money for not much value. so it's off now.
    // setInterval(async () => {
    //   try {
    //     if (!message) { return; }
        
    //     if (!reaction) {
    //       reaction = await message.react("🕒");
    //     } else {
    //       await reaction.remove();
    //       reaction = undefined;
    //     }
    //   } catch { /* oblivion */ }
    // }, DeadmanSwitchBehavior.TimeWindowDuration / 2);
  }

  private logDiscordActivity() {
    this.activityInLastMinute++;
    setTimeout(() => this.activityInLastMinute--, DeadmanSwitchBehavior.TimeWindowDuration);
  }

  private watch() {
    this.logger.trackMetric(LoggerCategory.SystemActivity, "Activity Per Minute", this.activityInLastMinute);
    this.logger.trackMetric(LoggerCategory.SystemActivity, "Handled Messages", this.messagesSinceLastReport);
    if (this.activityInLastMinute == 0) {
      this.logger.trackMetric(LoggerCategory.SystemActivity, "No Activity", 1);
      this.logger.trackError(LoggerCategory.SystemActivity, "No activity in a minute.");
      this.logger.flush();
      // process.exit(0);
    }

    this.messagesSinceLastReport = 0;
  }
}