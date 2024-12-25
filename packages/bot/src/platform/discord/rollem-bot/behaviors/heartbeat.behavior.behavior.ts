import { DiscordBehaviorBase } from "./discord.behavior.base";
import { ActivityType, Client } from "discord.js";
import { Logger, LoggerCategory } from "@common/services/logger.service/logger.service";
import { Config } from "@bot/discord-config.service";
import { ChangeLog } from "@common/services/changelog/changelog";
import moment from "moment";
import { Injectable } from "injection-js";
import { PromLogger } from "@common/services/prom-logger.service/prom-logger.service";

/**
 * Initializes the system after login and starts the heartbeat.
 */
@Injectable()
export class HeartbeatBehavior extends DiscordBehaviorBase {
  constructor(
    private readonly config: Config,
    private readonly changelog: ChangeLog,
    client: Client,
    promLogger: PromLogger,
    logger: Logger,
  ) { super(client, promLogger, logger); }

  protected async register() {
    this.client.on('ready', async () => {
      this.logger.trackSimpleEvent(LoggerCategory.SystemActivity, "ready");

      console.log("will defer to: " + this.config.deferToClientIds);
      console.log('username: ' + this.client.user?.username);
      console.log('id: ' + this.client.user?.id);

      this.client.user!
        .setPresence({
          activities: [{
            type: ActivityType.Playing,
            name: `rollem.rocks|${this.changelog.version}`,
          }],
          status: 'online',
        });

      const mentionRegex = '^<@!' + this.client.user?.id + '>\\s+|^<@' + this.client.user?.id + '>\\s+';
      this.config.mentionRegex = new RegExp(mentionRegex);

      this.sendHeartbeat("startup message");
      this.sendHeartbeatNextHour();
    });
  }

  private sendHeartbeatNextHour() {
    const now = moment();
    const nextHour = moment().endOf('h');
    const msToNextHour = nextHour.diff(now);
    setTimeout(
      () => {
        this.sendHeartbeat("heartbeat at " + nextHour.toString());
        this.sendHeartbeatNextHour();
      },
      msToNextHour
    );
  }

  /** Sends a single heartbeat-info message to owner confirming liveliness. */
  private sendHeartbeat(reason: string) {
    const disableHeartbeat = process.env.DISABLE_HEARTBEAT
    if (disableHeartbeat) { return; }

    this.logger.trackSimpleEvent(LoggerCategory.SystemActivity, `heartbeat - shard ${this.logger.shardName()}`, {reason: reason});
  }
}
