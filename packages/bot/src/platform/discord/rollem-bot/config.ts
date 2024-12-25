import { Injectable } from "injection-js";

/** Loads and stores various configuration values. */
@Injectable()
export class Config {
  /** The ID of this shard. Must be below @see ShardCount. */
  public readonly ShardId = process.env.DISCORD_BOT_SHARD_ID ? +process.env.DISCORD_BOT_SHARD_ID : undefined;

  /** The number of shards. */
  public readonly ShardCount = process.env.DISCORD_BOT_SHARD_COUNT ? +process.env.DISCORD_BOT_SHARD_COUNT : undefined;

  /** True if the config has all needed shard info. */
  public readonly HasShardInfo = this.ShardId != undefined && this.ShardCount != undefined;

  /** Gets a machine-ready shard label. */
  public get ShardLabel(): string {
    if (this.ShardId !== undefined && this.ShardCount !== undefined) {
      return `${this.ShardId+1}-of-${this.ShardCount}`
    } else {
      return '1-of-1';
    }
  }

  /** Gets a human-readable shard label */
  public get ShardName(): string {
    if (this.ShardId !== undefined && this.ShardCount !== undefined) {
      return `${this.ShardId+1} of ${this.ShardCount}`
    } else {
      return 'only';
    }
  }

  /** When true, indicates Rollem should launch in a local diagnostic mode, and not send any replies. */
  public get inLocalDiagnosticMode(): boolean {
    return (process.env.ROLLEM_LOCAL_DIAGNOSTIC_MODE ?? "false").toLowerCase() === "true";
  }

  /** The user token for Discord. */
  public get Token(): string {
    var token = process.env.DISCORD_BOT_USER_TOKEN;
    if (!token) {
      throw new Error("DISCORD_BOT_USER_TOKEN not set");
    }

    return token;
  }

  /** The client IDs to defer to. If any of these clients are present in a channel, do not respond. */
  public readonly deferToClientIds = (process.env.DEFER_TO_CLIENT_IDS || '').split(',');

  /** The AI Connection String. */
  public readonly AppInsightsConnectionString = process.env.APPINSIGHTS_CONNECTIONSTRING;

  /** The regex to be used to determine if the bot was mentioned. Updated after login. <@!...> means the message was tab-completed, <@...> means it was typed manually and inferred. */
  public mentionRegex: RegExp = /$<@!999999999999999999>|<@999999999999999999>/i;

  /** The interval between updating the "Now Playing" message under the bot. */
  public readonly messageInterval = 59 * 1000; // every minute (less a bit, so it will trigger other "every minute" monitors)
}