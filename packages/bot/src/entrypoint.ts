// these must be the first imported items
import "reflect-metadata";
import nodeFetch from 'node-fetch';
import util from 'util';
global.fetch = nodeFetch as any;

import { Config } from "@bot/config";
import { fetchGatewayBotInfo, groupShardsByRateLimitKey } from "./discord/startup";
import pidusage from "pidusage";
import { bootstrapShardedBotInternal } from "@bot/bot-sharded-internal";
import { Status } from "discord.js";


async function doInit() {

  const config = new Config();
  const botInfo = await fetchGatewayBotInfo(config.Token);
  const grouping = groupShardsByRateLimitKey(botInfo, { forceShardCount: 176});
  
  const ourBucketId = 0;
  const ourBucket = grouping.rateLimitBuckets[ourBucketId]
  console.debug("Selected Bucket:", ourBucket);

  const client = await bootstrapShardedBotInternal({
    shardCount: ourBucket.totalShardCount,
    shards: ourBucket.shardIds
  });
  
  setInterval(async () => await printUsage(), 1_000);
  // const options: ShardingManagerOptions = {
  //   token: config.Token,
  //   totalShards: ourBucket.totalShardCount,
  //   shardList: ourBucket.shardIds,
  // };
  // const manager = new ShardingManager('./dist/bundle-single-shard.js', options);
  
  // manager.on('shardCreate', shard => {
  //   console.debug();
  //   console.debug(`Launched shard`, shard.id);
  // });
  
  /** Dump Memory Usage */
  async function printUsage(): Promise<void> {
    const parentUsageBytes = process.memoryUsage.rss()
    const parentPidUsageBytes = await pidusage(process.pid)
    const memFactor = 1024*1024;
    const memUnit = 'MB'
  
    console.debug();
    console.debug("###########################");
    console.debug("## Memory v Shard Status ##");
    console.debug("###########################");
    console.debug("      ", parentPidUsageBytes.memory/memFactor, `${memUnit}\t(Process via pid)`)
    console.debug("      ", parentUsageBytes/memFactor, `${memUnit}\t(Process via rss)`) 
    client.ws.shards.forEach(shard => {
      shard.ping
      console.debug("Shard:", Status[shard.status], "With ping", shard.ping, "at", new Date(shard.lastPingTimestamp), `(Shard = ${shard.id} of ${ourBucket.totalShardCount})`);
    });
    console.debug("###########################");
  }
}

doInit();