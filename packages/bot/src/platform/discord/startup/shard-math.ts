import { RollemConfigError } from "@common/errors";
import { humanizeMillisForDebug } from "@common/util/humanize-duration";
import { humanizeInteger } from "@common/util/number-with-commas";
import { ENV_CONFIG } from "@root/platform/env-config.service";
import { APIGatewayBotInfo } from "discord.js";
import { chunk } from "lodash";
import moment from "moment";

/** Information about a single Rollem Shard Bucket. */
export interface ShardRateLimitBucket {
  /** The rate limit key assigned to this grouping */
  rateLimitKey: number;

  /** The shard IDs in this grouping. */
  shardIds: number[];

  /** The number of shards in this grouping. */
  groupShardCount: number;

  /** The total number of shards determined. */

  totalShardCount: number;
}

export interface BoundsEstimates {
  guildCount: Bounds;
  minShards: Bounds;
  minShardsMultiple: Bounds;

}

/** A bounded value. */
export interface Bounds {
  /** The higher bound. */
  upper: number;

  /** The lower bound. */
  lower: number;
}

/** The result of @see groupShardsByRateLimitKey */
export interface ShardGroupings {
  /** Response from the API Gateway Bot Info endpoint. */
  botInfo: APIGatewayBotInfo;

  /** Values estimated as part of grouping shards. */
  bounds: BoundsEstimates;

  /** The ultimate bucketing arrived at. */
  rateLimitBuckets: Record<number, ShardRateLimitBucket>

  /** Sets of shards which may be started concurrently. */
  noRateLimitBuckets: Record<number, ShardRateLimitBucket>;

  /** The preferred set of shard rate limit buckets -- between {@link rateLimitBuckets} and {@link noRateLimitBuckets}. */
  preferredBuckets: Record<number, ShardRateLimitBucket>,
}

/** Options configuring @see groupShardsByRateLimitKey */
export interface ShardGroupingOptions {
  forcedRateLimitBucketSize?: number;

  forceShardCount?: number;

  ignoreRateLimitBuckets?: boolean;
}

/**
 * Computes rate-limit-based recommended-shard groupings, given an API Gateway Bot Info response.
 * 
 * See https://discord.com/developers/docs/events/gateway#sharding-max-concurrency
 */
export function groupShardsByRateLimitKey(botInfo: APIGatewayBotInfo, options: ShardGroupingOptions = { }): ShardGroupings {
  options ??= {};

  const limit = botInfo.session_start_limit;

  const shardCountMultiple = options.forcedRateLimitBucketSize ?? limit.max_concurrency; // I know from experience this is 16, which happens to match the current max_concurrency number

  // estimating off ~1,000 guilds/shard from suggested number, and assuming the suggested number is rounded up by shardCountMultiple
  const guildCountLowerBound = (botInfo.shards - shardCountMultiple) * 1_000;
  const guildCountUpperBound = (botInfo.shards) * 1_000;

  // estimating acceptable minimum shard count based on above estimations
  const minShardsLowerBound = guildCountLowerBound / 2_500;
  const minShardsUpperBound = guildCountUpperBound / 2_500;

  // rounding up to nearest acceptable multiple (16? max_concurrency?)
  const minShardsLowerBoundMultiple = Math.ceil(minShardsLowerBound / shardCountMultiple) * shardCountMultiple;
  const minShardsUpperBoundMultiple = Math.ceil(minShardsUpperBound / shardCountMultiple) * shardCountMultiple;

  // calculating overrides
  const targetShardsCount = options.forceShardCount ?? botInfo.shards;

  // summary for the console
  console.debug("Recommended Shard Count: ", botInfo.shards, "shards");
  console.debug("  Estimated Guild Range: ", humanizeInteger(guildCountLowerBound), "-", humanizeInteger(guildCountUpperBound));
  console.debug(" Acceptable Shard Count: ", minShardsLowerBound, "-", minShardsUpperBound, "  multiple (", minShardsLowerBoundMultiple, "-", minShardsUpperBoundMultiple, ")");
  console.debug("      Concurrency Limit: ", limit.max_concurrency, " with ", limit.max_concurrency, "groups of", targetShardsCount / limit.max_concurrency, "shards");
  console.debug("        Auths Remaining: ", humanizeInteger(limit.remaining), "/", humanizeInteger(limit.total), " ≈ ", Math.floor(limit.remaining/limit.total*10000)/100, "%");
  console.debug("              Resets in: ", ...humanizeMillisForDebug(limit.reset_after));
  console.debug();
  if (!!options.forceShardCount)
    console.debug("##   Forced Shard Count: ", options.forceShardCount)
  if (targetShardsCount <= minShardsUpperBoundMultiple)
    console.debug("##   MIN SHARDS WARNING: ", "Shard Count Override is dangerously close to estimated minimum range of", minShardsUpperBoundMultiple);
  if (targetShardsCount <= minShardsLowerBoundMultiple)
    console.debug("##   MIN SHARDS WARNING: ", "SHARD COUNT OVERRIDE IS DANGEROUSLY CLOSE TO ESTIMATED **TRUE** MINIMUM OF", minShardsUpperBoundMultiple);
  if (targetShardsCount % shardCountMultiple)
    console.debug("##     MULTIPLE WARNING: ", "Shard Count is not a multiple of max_concurrency = ", shardCountMultiple);
  if (!!options.forcedRateLimitBucketSize)
    console.debug("##   RATE LIMIT BUCKETS: ", "Forced to value", options.forcedRateLimitBucketSize, "where default is", limit.max_concurrency);
  if (!!options.ignoreRateLimitBuckets)
    console.debug("##   RATE LIMIT BUCKETS: ", "Ignored -- Preferring 'rateLimitBuckets' over 'noRateLimitBuckets'");

  console.debug();

  // bail if it's out of bounds
  if (targetShardsCount < 0) { throw new RollemConfigError({message: `Shard Count must be at least 1 (got ${targetShardsCount})`}); }

  const rateLimitBuckets: Record<number, ShardRateLimitBucket> = [];
  for (var shard = 0; shard < targetShardsCount; shard++) {
    const rateLimitKey = shard % limit.max_concurrency;
    var rateLimitBucket = (rateLimitBuckets[rateLimitKey] ??= { rateLimitKey, shardIds: [], totalShardCount: targetShardsCount, groupShardCount: 0 });
    rateLimitBucket.shardIds.push(shard);
    rateLimitBucket.groupShardCount++;
  }

  const noRateLimitBuckets: ShardRateLimitBucket[]
    = chunk([...Array(targetShardsCount).keys()], limit.max_concurrency)
      .map(v => {
        return {
          groupShardCount: v.length,
          rateLimitKey: -1,
          shardIds: v,
          totalShardCount: targetShardsCount,
        }
      });

  return {
    botInfo,
    rateLimitBuckets,
    noRateLimitBuckets,
    preferredBuckets: options.ignoreRateLimitBuckets ? rateLimitBuckets : noRateLimitBuckets,
    bounds: {
      guildCount: { upper: guildCountUpperBound, lower: guildCountLowerBound },
      minShards: { upper: minShardsUpperBound, lower: minShardsLowerBound },
      minShardsMultiple: { upper: minShardsUpperBoundMultiple, lower: minShardsLowerBoundMultiple }
    }
  };
}