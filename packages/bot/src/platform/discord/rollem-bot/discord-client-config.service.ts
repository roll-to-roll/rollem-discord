import { APIGatewayBotInfo, ClientOptions, IntentsBitField, Partials, SimpleIdentifyThrottler } from "discord.js";
import { Injectable } from "injection-js";
import { Config } from "./discord-config.service";
import { IInitializeable } from "@common/util/injector-wrapper";
import { ShardGroupings, ShardRateLimitBucket, fetchGatewayBotInfo, groupShardsByRateLimitKey } from "@root/platform/discord/startup";
import { RollemInitializerError } from "@common/errors/initializer-error";
import { THROW } from "@common/errors/do-error";

/** Coordinates selection and construction of {@link ClientOptions} for {@link Client}. */
@Injectable()
export class DiscordClientConfigService implements IInitializeable {
  public botInfo?: APIGatewayBotInfo;
  public grouping?: ShardGroupings;
  public ourBucket?: ShardRateLimitBucket;

  constructor(private readonly config: Config) {
  }

  public async initialize(): Promise<void> {
    if (!!this.botInfo) { return; }
    if (!!this.grouping) { return; }
    if (!!this.ourBucket) { return; }
    await this.config.initialize();
    
    this.botInfo = await fetchGatewayBotInfo(this.config.Token);
    this.grouping = groupShardsByRateLimitKey(this.botInfo, { forceShardCount: 176});
    this.ourBucket = this.grouping.rateLimitBuckets[0];
  }

  /** Used by the client during construction. */
  public get clientOptions(): ClientOptions {
    return {
      shards: this.ourBucket?.shardIds ?? THROW(new RollemInitializerError({ message: "INITIALIZE SHARDS." })),
      shardCount: this.ourBucket?.totalShardCount ?? THROW(new RollemInitializerError({ message: "INITIALIZE." })),
      partials: [ Partials.Channel ],
      intents: [
        IntentsBitField.Flags.Guilds,
        // "GUILD_MEMBERS", // requires authorization and we don't need it
        IntentsBitField.Flags.GuildBans,
        IntentsBitField.Flags.GuildEmojisAndStickers,
        IntentsBitField.Flags.GuildIntegrations,
        IntentsBitField.Flags.GuildWebhooks,
        IntentsBitField.Flags.GuildInvites,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.MessageContent,
        // "GUILD_PRESENCES", // requires authorization and we don't need it
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildMessageTyping,
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.DirectMessageReactions,
        IntentsBitField.Flags.DirectMessageTyping,
      ],
      ws: {
        buildIdentifyThrottler: _ => new SimpleIdentifyThrottler(this.botInfo?.session_start_limit.max_concurrency ?? THROW(new RollemInitializerError({ message: "INITIALIZE SHARDS." }))),
      }
    };
  }

}