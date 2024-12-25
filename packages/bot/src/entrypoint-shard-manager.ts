// these must be the first imported items
import "reflect-metadata";
import nodeFetch from 'node-fetch';
import util from 'util';
global.fetch = nodeFetch as any;

import { ShardingManager, ShardingManagerOptions } from "discord.js";
import { Config } from "@bot/config";
import { fetchGatewayBotInfo, groupShardsByRateLimitKey } from "./discord/startup";
import { env } from "process";
import pidusage from "pidusage";


async function doInit() {
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
  
  setInterval(async () => await printUsage(), 1_000);
  
  const shardsLookup = manager.spawn({ delay: 0 });
  
  async function printUsage(): Promise<void> {
    const parentUsageBytes = process.memoryUsage.rss()
    const parentPidUsageBytes = await pidusage(process.pid)
    const memFactor = 1024*1024;
    const memUnit = 'MB'
  
    console.debug();
    console.debug("############################");
    console.debug("## Computing Memory Usage ##");
    console.debug("############################");
    console.debug("      ", parentPidUsageBytes.memory/memFactor, `${memUnit}\t(Process via pid)`)
    console.debug("      ", parentUsageBytes/memFactor, `${memUnit}\t(Process via rss)`)
    const childrenBytes$ = manager.shards
      .filter(s => !!s.process?.pid)
      .map(shard => { return { stats$: pidusage(shard.process!.pid!), shard }; })
      .map(async ({ stats$, shard }) => {
      var childPidUsageBytes = await stats$;
      console.debug("Shard:", childPidUsageBytes.memory/memFactor, `${memUnit}\t(Shard = ${shard.id} of ${options.totalShards})`);
      return childPidUsageBytes;
    });
    const childrenBytes = await Promise.all(childrenBytes$);
    console.debug("############################");
    const total = childrenBytes.map(s => s.memory/memFactor).reduce((a, b) => a + b, parentPidUsageBytes.memory/memFactor);
    console.debug(`## Total:`, total, `${memUnit}`);
  }
}

doInit();