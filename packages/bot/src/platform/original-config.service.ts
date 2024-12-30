import { IInitializeable } from "@common/util/injector-wrapper";
import { ENV_CONFIG } from "@root/platform/env-config.service";
import { Injectable } from "injection-js";

/** Loads and stores various configuration values. @deprecated */
@Injectable()
export class OriginalConfig implements IInitializeable {
  /** The ID of this shard. Must be below @see ShardCount. @deprecated */
  public readonly ShardId = ENV_CONFIG.shardSetInfo.index;

  /** The number of shards. @deprecated */
  public readonly ShardCount = ENV_CONFIG.shardSetInfo.setCount;

  public initialize(): Promise<void> {
    return Promise.resolve();
  }

  /** Gets a machine-ready shard label. @deprecated */
  public get ShardLabel(): string {
    return ENV_CONFIG.openTelemetry.ServiceInstanceId;
  }

  /** Gets a human-readable shard label @deprecated */
  public get ShardName(): string {
    return ENV_CONFIG.shardSetInfo.name
  }

  /** When true, indicates Rollem should launch in a local diagnostic mode, and not send any replies. @deprecated */
  public get inLocalDiagnosticMode(): boolean {
    return ENV_CONFIG.behaviorConfig.diagnosticMode;
  }

  /** The user token for Discord. @deprecated */
  public get Token(): string {
    return ENV_CONFIG.secrets.discordToken;
  }

  /** The client IDs to defer to. If any of these clients are present in a channel, do not respond. @deprecated */
  public readonly deferToClientIds = ENV_CONFIG.behaviorConfig.deferToBotClientIds;

  /** The AI Connection String. @deprecated */
  public readonly AppInsightsConnectionString = ENV_CONFIG.secrets.appInsightsConnectionString;

  /** The regex to be used to determine if the bot was mentioned. Updated after login. <@!...> means the message was tab-completed, <@...> means it was typed manually and inferred. @deprecated */
  public mentionRegex: RegExp = /$<@!999999999999999999>|<@999999999999999999>/i;

  /** The interval between updating the "Now Playing" message under the bot. @deprecated */
  public readonly messageInterval = 59 * 1000; // every minute (less a bit, so it will trigger other "every minute" monitors)
}