import { PretendCollection } from "@root/platform/discord/client/cache/base-collections/pretend-collection";
import { ChannelCollection } from "@root/platform/discord/client/cache/collections/channel.collection";
import { GuildMemberCollection } from "@root/platform/discord/client/cache/collections/guild-member.collection";
import { GuildCollection } from "@root/platform/discord/client/cache/collections/guild.collection";
import { RoleCollection } from "@root/platform/discord/client/cache/collections/role.collection";
import { Channel } from "diagnostics_channel";
import { CacheFactory, CacheWithLimitsOptions, CachedManager, Caches, ChannelManager, Collection, DataManager, Guild, GuildChannel, GuildChannelManager, GuildManager, GuildMemberManager, Options, PermissionOverwriteManager, PermissionOverwrites, Role, RoleManager } from "discord.js";
import { Injectable } from "injection-js";
import sizeof from "object-sizeof";

/**
 * DiscordJS Cache constructors, including excluded lines.
 * 
 * The original comments out these items, apparently because modifying them has a tendency to break things.
 * See https://github.com/discordjs/discord.js/blob/c484e3de250e2ed52f9651b1fc7f2b27990ef632/packages/discord.js/typings/index.d.ts#L5073-L5103
 */
type DJS_Caches_Forbidden = Caches & {
  ChannelManager: [manager: typeof ChannelManager, holds: typeof Channel];
  GuildChannelManager: [manager: typeof GuildChannelManager, holds: typeof GuildChannel];
  GuildManager: [manager: typeof GuildManager, holds: typeof Guild];
  PermissionOverwriteManager: [manager: typeof PermissionOverwriteManager, holds: typeof PermissionOverwrites];
  RoleManager: [manager: typeof RoleManager, holds: typeof Role];
}

/** A duplicate of a DJS type, but pointed at our forbidden cache list. See https://github.com/discordjs/discord.js/blob/c484e3de250e2ed52f9651b1fc7f2b27990ef632/packages/discord.js/typings/index.d.ts#L5105-L5107 */
type DJS_CacheConstructors_Forbidden = {
  [Cache in keyof DJS_Caches_Forbidden]: DJS_Caches_Forbidden[Cache][0] & { name: Cache };
};

/** A duplicate of a DJS type, but pointed at our forbidden cache list. See https://github.com/discordjs/discord.js/blob/c484e3de250e2ed52f9651b1fc7f2b27990ef632/packages/discord.js/typings/index.d.ts#L5117-L5121*/
type DJS_CacheFactory_Forbidden = (
  // The original excludes `Exclude<...,  OverriddenCaches>` - which we opt not to do here. See https://github.com/discordjs/discord.js/blob/c484e3de250e2ed52f9651b1fc7f2b27990ef632/packages/discord.js/typings/index.d.ts#L5109-L5113
  managerType: DJS_CacheConstructors_Forbidden[keyof DJS_Caches_Forbidden],
  holds: DJS_Caches_Forbidden[(typeof manager)['name']][1],
  manager: DJS_CacheConstructors_Forbidden[keyof DJS_Caches_Forbidden],
) => (typeof manager)['prototype'] extends DataManager<infer Key, infer Value, any> ? Collection<Key, Value> : never;

type DJS_ManagerType = Parameters<CacheFactory>[0];
type DJS_Holds = Parameters<CacheFactory>[1];
type DJS_Manager = Parameters<CacheFactory>[2];
type DJS_AcceptableCache = ReturnType<CacheFactory>;

type DJS_ManagerType_Forbidden = Parameters<DJS_CacheFactory_Forbidden>[0];
type DJS_Holds_Forbidden = Parameters<DJS_CacheFactory_Forbidden>[1];
type DJS_Manager_Forbidden = Parameters<DJS_CacheFactory_Forbidden>[2];
type DJS_AcceptableCache_Forbidden = ReturnType<DJS_CacheFactory_Forbidden>;

/**
 * Central class for configuring Discord Client Cache.
 * Many of the changes within are not recommended by Discord.js and may
 * break functionality -- they are done in the pursuit of lower RAM usage.
 */
@Injectable()
export class CacheService {

  constructor() {}

  /**
   * Overrides for caching behavior which may break functionality.
   * 
   * Intentionally breaks type-safety checks put in by Discord.js to allow overriding caching for things like {@link GuildManager}.
   * This is dangerous, but also halves RAM consumption.
   */
  private makeCacheOverrideDangerous(
    managerType: DJS_ManagerType_Forbidden,
    _holds: DJS_Holds_Forbidden,
    _manager: DJS_Manager_Forbidden,
  ): DJS_AcceptableCache_Forbidden | undefined {
    switch (managerType) {
      case RoleManager: return new RoleCollection();
      case GuildManager: return new GuildCollection();
      case ChannelManager: return new ChannelCollection();
      case GuildMemberManager: return new GuildMemberCollection();
      default: return undefined;
    }
  }

  /** Overrides for caching behavior which is unlikely to berak functionality. */
  private makeCacheOverride(
    managerType: DJS_ManagerType,
    _holds: DJS_Holds,
    manager: DJS_Manager,
  ): DJS_AcceptableCache | undefined {
    const name = managerType.name ?? manager.name;
    return PretendCollection.makeOne(name)
  }

  /** Options passed to {@link Options.cacheWithLimits} when fallback is used. */
  public readonly cacheWithLimitsOptions: CacheWithLimitsOptions = {
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
  }

  /** Used when configuring the Discord {@link Client}. */
  public makeCache: CacheFactory = this.makeCacheInternal.bind(this);

  /** Generates a cache with limits (or full cache) depending on typical Discord override settings. */
  private makeCacheWithLimits: CacheFactory = Options.cacheWithLimits(this.cacheWithLimitsOptions);

  /**
   * Create a cache using one of our manual overrides via {@link makeCacheOverride}.\
   * 
   * If no cache override is produced, create a {@link LimitedCollection} via our configured {@link makeCacheWithLimits} / {@link cacheWithLimitsOptions.}
   * 
   * @remarks This function exists separately as an extra layer of type compatibility checking.
   */
  private makeCacheInternal(
    managerType: DJS_ManagerType,
    holds: DJS_Holds,
    manager: DJS_Manager,
  ): DJS_AcceptableCache {
    return this.makeCacheOverrideDangerous(managerType, holds, manager)
      ?? this.makeCacheOverride(managerType, holds, manager)
      ?? this.makeCacheWithLimits(managerType, holds, manager);
  }
}
