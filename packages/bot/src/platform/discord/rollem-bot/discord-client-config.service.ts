import { APIGatewayBotInfo, CacheConstructors, CacheFactory, CacheWithLimitsOptions, Caches, ClientOptions, Collection, IIdentifyThrottler, IntentsBitField, Options, Partials, SimpleIdentifyThrottler } from "discord.js";
import { Injectable } from "injection-js";
import { Config } from "./discord-config.service";
import { IInitializeable } from "@common/util/injector-wrapper";
import { ShardGroupings, ShardRateLimitBucket, fetchGatewayBotInfo, groupShardsByRateLimitKey } from "@root/platform/discord/startup";
import { RollemInitializerError } from "@common/errors/initializer-error";
import { THROW } from "@common/errors/do-error";
import { MinimalLimitedCache } from "@bot/discord-client-minimal-cache";
import { PretendCache } from "@bot/discord-client-pretend-cache";

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
    this.grouping = groupShardsByRateLimitKey(this.botInfo, { forceShardCount: 1});
    this.ourBucket = this.grouping.noRateLimitBuckets[0];
  }

  public cacheFactoryFactory(settings: CacheWithLimitsOptions): CacheFactory {
    const regularFactory = Options.cacheWithLimits({
      ...Options.DefaultMakeCacheSettings,
      GuildMemberManager: {
        maxSize: 0,
        keepOverLimit: member => member.id === member.client.user.id,
      }, // we might need this for replies
      GuildMessageManager: {maxSize: 0}, // we might need this for replies
      GuildTextThreadManager: {maxSize: 0}, // we might need this for replies
      MessageManager: {maxSize: 0}, // we might need this for replies
      DMMessageManager: {maxSize: 0}, // we might need this for replies
      GuildEmojiManager: {maxSize: 0}, // we might want this for reacts
      UserManager: {maxSize: 0}, // we might need this for replies
      ThreadManager: {maxSize: 0}, // we might need this for replies

      // we should never need any of these
      GuildBanManager: {maxSize: 0},
      ApplicationCommandManager: {maxSize: 0},
      AutoModerationRuleManager: {maxSize: 0},
      BaseGuildEmojiManager: {maxSize: 0},
      GuildForumThreadManager: {maxSize: 0},
      GuildInviteManager: {maxSize: 0},
      GuildScheduledEventManager: {maxSize: 0},
      GuildStickerManager: {maxSize: 0},
      PresenceManager: {maxSize: 0},
      ReactionManager: {maxSize: 0},
      ReactionUserManager: {maxSize: 0},
      StageInstanceManager: {maxSize: 0},
      ThreadMemberManager: {maxSize: 0},
      VoiceStateManager: {maxSize: 0},
    });

    settings ??= {};
    return (
      managerType: CacheConstructors[keyof Caches],
      holds: Caches[(typeof manager)['name']][1],
      manager: CacheConstructors[keyof Caches]
    ) => {
      const name = manager.name ?? managerType.name;
      switch (name) {
        case 'GuildManager' as any:
        case 'RoleManager' as any:
        case 'PermissionOverwriteManager' as any:
        case 'ChannelManager' as any:
        // these are also on the "override" list
        // case 'DMMessageManager' as any:
        // case 'GuildForumThreadManager' as any:
        // case 'GuildMessageManager' as any:
        // case 'GuildTextThreadManager' as any:
        case 'GuildMemberManager': // stores role info

        // case 'DMMessageManager':
        // case 'MessageManager':
        // case 'UserManager':
        // case 'GuildMessageManager':
          return regularFactory(managerType as any, holds, manager);
        default:
          return PretendCache.makeOne(name);
      }
    };
  }

  /** Used by the client during construction. */
  public get clientOptions(): ClientOptions {
    return {
      shards: this.ourBucket?.shardIds ?? THROW(new RollemInitializerError({ message: "INITIALIZE SHARDS." })),
      shardCount: this.ourBucket?.totalShardCount ?? THROW(new RollemInitializerError({ message: "INITIALIZE." })),

      // TODO: Investigate full implications of partials
      partials: [
        Partials.Message, // this is the only one we actually need non-partial for
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
      makeCache: this.cacheFactoryFactory({
        ...Options.DefaultMakeCacheSettings,
        GuildMemberManager: {
          maxSize: 0,
          keepOverLimit: member => member.id === member.client.user.id,
        }, // we might need this for replies
        GuildMessageManager: {maxSize: 0}, // we might need this for replies
        GuildTextThreadManager: {maxSize: 0}, // we might need this for replies
        MessageManager: {maxSize: 0}, // we might need this for replies
        DMMessageManager: {maxSize: 0}, // we might need this for replies
        GuildEmojiManager: {maxSize: 0}, // we might want this for reacts
        UserManager: {maxSize: 0}, // we might need this for replies
        ThreadManager: {maxSize: 0}, // we might need this for replies

        // we should never need any of these
        GuildBanManager: {maxSize: 0},
        ApplicationCommandManager: {maxSize: 0},
        AutoModerationRuleManager: {maxSize: 0},
        BaseGuildEmojiManager: {maxSize: 0},
        GuildForumThreadManager: {maxSize: 0},
        GuildInviteManager: {maxSize: 0},
        GuildScheduledEventManager: {maxSize: 0},
        GuildStickerManager: {maxSize: 0},
        PresenceManager: {maxSize: 0},
        ReactionManager: {maxSize: 0},
        ReactionUserManager: {maxSize: 0},
        StageInstanceManager: {maxSize: 0},
        ThreadMemberManager: {maxSize: 0},
        VoiceStateManager: {maxSize: 0},
      }),

      ws: {
        // no waiting. we have specifically selected shards to not share rate-limit-keys
        buildIdentifyThrottler: async _ => Promise.resolve({
          waitForIdentify(shardId, signal) {
            return Promise.resolve();
          }
        })
      }
    };
  }

}