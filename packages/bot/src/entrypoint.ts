// these must be the first imported items
import "reflect-metadata";
import nodeFetch from 'node-fetch';
import util from 'util';
global.fetch = nodeFetch as any;

import { ShardingManager, ShardingManagerOptions } from "discord.js";
import { Config } from "@bot/config";
import { fetchGatewayBotInfo, groupShardsByRateLimitKey } from "./discord/startup";

const config = new Config();
const botInfo = await fetchGatewayBotInfo(config.Token);
const grouping = groupShardsByRateLimitKey(botInfo, { forceShardCount: 176});

const ourBucketId = 0;
const ourBucket = grouping.rateLimitBuckets[ourBucketId]
console.debug("Selected Bucket:", ourBucket);

// console.debug("Bot Info:", grouping);
// for (const group of values(grouping.rateLimitBuckets)) { console.debug("Groupings", group); }

// await bootstrapSingleBot();

const options: ShardingManagerOptions = {
  token: config.Token,
  totalShards: ourBucket.totalShardCount,
  shardList: ourBucket.shardIds,
};
const manager = new ShardingManager('./dist/bundle-single-shard.js', options);

manager.on('shardCreate', shard => {
  console.debug();
  console.debug(`Launched shard`, shard.id);
});

manager.spawn();