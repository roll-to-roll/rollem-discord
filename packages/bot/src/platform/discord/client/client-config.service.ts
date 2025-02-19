import { APIGatewayBotInfo, CacheConstructors, CacheFactory, CacheWithLimitsOptions, CachedManager, Caches, Client, ClientOptions, Collection, Constructable, Guild, GuildManager, IIdentifyThrottler, IntentsBitField, Options, Partials, Role, RoleManager, SimpleIdentifyThrottler, Channel, BaseChannel, GuildMemberManager } from "discord.js";
import { Injectable } from "injection-js";
import { OriginalConfig } from "../../original-config.service";
import { IInitializeable } from "@common/util/injector-wrapper";
import { ShardGroupings, ShardRateLimitBucket, fetchGatewayBotInfo, groupShardsByRateLimitKey } from "@root/platform/discord/startup";
import { RollemInitializerError } from "@common/errors/initializer-error";
import { THROW } from "@common/errors/do-error";
import { MinimalLimitedCollection } from "@root/platform/discord/client/cache/base-collections/minimal-limited-collection";
import { PretendCollection } from "@root/platform/discord/client/cache/base-collections/pretend-collection";
import { RoleCollection } from "@root/platform/discord/client/cache/collections/role.collection";
import { GuildMemberCollection } from "./cache/collections/guild-member.collection";
import { ChannelCollection } from "./cache/collections/channel.collection";
import { GuildCollection } from "./cache/collections/guild.collection";
import { SpecialCollection } from "./cache/base-collections/special-collection";
import { CacheService } from "@root/platform/discord/client/cache/cache.service";
import { ENV_CONFIG } from "@root/platform/env-config.service";

/** Coordinates selection and construction of {@link ClientOptions} for {@link Client}. */
@Injectable()
export class ClientConfigService implements IInitializeable {
  public botInfo?: APIGatewayBotInfo;
  public grouping?: ShardGroupings;
  public ourBucket?: ShardRateLimitBucket;

  constructor(
    private readonly cache: CacheService,
    private readonly config: OriginalConfig,
  ) {
  }

  public async initialize(): Promise<void> {
    if (!!this.botInfo) { return; }
    if (!!this.grouping) { return; }
    if (!!this.ourBucket) { return; }
    await this.config.initialize();
    
    this.botInfo = await fetchGatewayBotInfo(this.config.Token);
    this.grouping = groupShardsByRateLimitKey(
      this.botInfo,
      {
        forceShardCount: ENV_CONFIG.shardSetInfo.totalShards,
        forcedRateLimitBucketSize: ENV_CONFIG.shardSetInfo.rateLimitBuckets.forcedSize,
        ignoreRateLimitBuckets: ENV_CONFIG.shardSetInfo.rateLimitBuckets.ignore,
      });

    this.ourBucket = this.grouping.preferredBuckets[ENV_CONFIG.shardSetInfo.index];
  }

  /** Used by the client during construction. */
  public get clientOptions(): ClientOptions {
    return {
      shards: this.ourBucket?.shardIds ?? THROW(new RollemInitializerError({ message: "INITIALIZE SHARDS." })),
      shardCount: this.ourBucket?.totalShardCount ?? THROW(new RollemInitializerError({ message: "INITIALIZE." })),

      // TODO: Investigate full implications of partials
      partials: [
        Partials.Message, // this is the only one we actually need non-partial for
        Partials.Channel, // this is required to receive DMs from users that are not me (wtf?)
      ],

      // TODO: we can probably reduce this once we no longer need a deadman switch
      intents: [
        IntentsBitField.Flags.Guilds,
        // "GUILD_MEMBERS", // requires authorization and we don't need it
        // IntentsBitField.Flags.GuildBans,
        // IntentsBitField.Flags.GuildEmojisAndStickers,
        // IntentsBitField.Flags.GuildIntegrations,
        // IntentsBitField.Flags.GuildWebhooks,
        // IntentsBitField.Flags.GuildInvites,
        // IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.MessageContent,
        // "GUILD_PRESENCES", // requires authorization and we don't need it
        IntentsBitField.Flags.GuildMessages,
        // IntentsBitField.Flags.GuildMessageReactions,
        // IntentsBitField.Flags.GuildMessageTyping,
        IntentsBitField.Flags.DirectMessages,
        // IntentsBitField.Flags.DirectMessageReactions,
        // IntentsBitField.Flags.DirectMessageTyping,
      ],

      // See https://discordjs.guide/miscellaneous/cache-customization.html#limiting-caches
      makeCache: this.cache.makeCache,

      ws: ENV_CONFIG.shardSetInfo.rateLimitBuckets.ignore ? undefined : {
        // no waiting. we have specifically selected shards to not share rate-limit-keys
        buildIdentifyThrottler: async _ => Promise.resolve({
          waitForIdentify(_shardId, _signal) {
            return Promise.resolve();
          }
        })
      },
    };
  }

}