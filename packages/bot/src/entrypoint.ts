// these must be the first imported items
import "reflect-metadata";
import nodeFetch from 'node-fetch';
import util from 'util';
global.fetch = nodeFetch as any;

import { Config } from "@bot/discord-config.service";

import { InjectorWrapper } from "@common/util/injector-wrapper";
import { Storage } from "@rollem/common";
import { PromLogger } from "@common/services/prom-logger.service/prom-logger.service";
import { Logger } from "@common/services/logger.service/logger.service";
import { ChangeLog } from "@common/services/changelog/changelog";
import { RollemRandomSources } from "@bot/lib/rollem-random-sources.service";
import { RepliedMessageCache } from "@bot/lib/replied-message-cache.service";
import { Parsers } from "@common/services/parsers.service";
import { RollemParserV1, RollemParserV1Beta, RollemParserV2 } from "@rollem/language";
import { PromLoggerApi } from "@common/services/prom-logger.service/prom-logger-api.servic";
import { DiscordClientConfigService } from "@bot/discord-client-config.service";
import { DiscordClientService } from "@bot/discord-client.service";
import { DeadmanSwitchBehavior } from "@bot/behaviors/deadman-switch";
import { DieOnDisconnectBehavior } from "@bot/behaviors/die-on-disconnect.behavior";
import { DieOnErrorBehavior } from "@bot/behaviors/die-on-error.behavior";
import { DiscordBehaviorBase } from "@bot/behaviors/discord.behavior.base";
import { EventMonitorBehavior } from "@bot/behaviors/event-monitor.behavior";
import { HeartbeatBehavior } from "@bot/behaviors/heartbeat.behavior.behavior";
import { StandardAdapter } from "@bot/behaviors/standard-adapter.behavior";
import { BehaviorBase } from "@common/standard-behaviors/behavior.base";
import { ChangelogBehavior } from "@common/standard-behaviors/behaviors/changelog.behavior";
import { DiceBracketedBehavior } from "@common/standard-behaviors/behaviors/dice/dice-bracketed.behavior";
import { DiceShortPrefixedBehavior } from "@common/standard-behaviors/behaviors/dice/dice-short-prefixed.behavior";
import { DiceSoftParseBehavior } from "@common/standard-behaviors/behaviors/dice/dice-soft-parse.behavior";
import { DiceTaggedBehavior } from "@common/standard-behaviors/behaviors/dice/dice-tagged.behavior";
import { PingPongBehavior } from "@common/standard-behaviors/behaviors/ping-pong.behavior";
import { StatsBehavior } from "@common/standard-behaviors/behaviors/stats.behavior";
import { StorageBehavior } from "@common/standard-behaviors/behaviors/storage.behavior";
import { Newable } from "@common/util/types/utility-types";
import { BehaviorStatsBase } from "@common/standard-behaviors/stat.behavior.base";
import { DiscordStats } from "@root/platform/discord/discord-stats";
import { ClassProvider } from "injection-js";
import { Status } from "discord.js";
import pidusage from "pidusage";
import { fetchGatewayBotInfo } from "@root/platform/discord/startup";
import { humanizeInteger } from "@common/util/number-with-commas";
import { humanizeMillisForDebug } from "@common/util/humanize-duration";

const ORDERED_STANDARD_BEHAVIORS: Newable<BehaviorBase>[] = [
  PingPongBehavior,
  StatsBehavior,
  ChangelogBehavior,
  StorageBehavior,
  DiceBracketedBehavior,
  DiceShortPrefixedBehavior,
  DiceSoftParseBehavior,
  DiceTaggedBehavior,
];

/** The behaviors in the order in which they will be loaded. */
const ORDERED_DISCORD_BEHAVIORS: ClassProvider[] = [
  DieOnDisconnectBehavior.asBehavior(),
  DieOnErrorBehavior.asBehavior(),
  HeartbeatBehavior.asBehavior(),
  DeadmanSwitchBehavior.asBehavior(),
  EventMonitorBehavior.asBehavior(),
  StandardAdapter.asBehavior(),
];

async function doInit() {
  const topLevelScope = await InjectorWrapper.createTopLevelContext([
    PromLogger,
    // PromLoggerApi,
    Logger,
    ChangeLog,
    RollemRandomSources,
    Config,
    { provide: Storage, useValue: new Storage() },
    RollemParserV1,
    RollemParserV1Beta,
    RollemParserV2,
    Parsers,
    RepliedMessageCache,
    DiscordClientConfigService,
  ]).validateAllOrThrow().initialize();
  console.log("CONTINUING");
  const intermediateDiscordScope = topLevelScope.createChildContext([
    DiscordClientService,
    { provide: BehaviorStatsBase, useClass: DiscordStats },
    ...ORDERED_STANDARD_BEHAVIORS.map(b =>
      <ClassProvider>{
        provide: BehaviorBase,
        useClass: b,
        multi: true,
      }),
    ...ORDERED_DISCORD_BEHAVIORS,
  ]).validateAllOrThrow()
  
  const config = intermediateDiscordScope.get(Config);
  const ourBucket = intermediateDiscordScope.get(DiscordClientConfigService).ourBucket;
  const client = intermediateDiscordScope.get(DiscordClientService).client;
  
  setInterval(async () => await printUsage(), 1_000);
  
  intermediateDiscordScope.initialize();

  /** Dump Memory Usage */
  async function printUsage(): Promise<void> {
    const memoryUsage = process.memoryUsage();
    memoryUsage
    const memFactor = 1024*1024;
    const memUnit = 'MB'
  
    console.debug();
    console.debug("###########################");
    console.debug("## Memory v Shard Status ##");
    console.debug("###########################");
    console.debug("      ", Math.floor(memoryUsage.rss/memFactor),          `${memUnit}\t(Process via rss)`);
    console.debug("      ", Math.floor(memoryUsage.heapUsed/memFactor),     `${memUnit}\t(Heap Used)`);
    console.debug("      ", Math.floor(memoryUsage.heapTotal/memFactor),    `${memUnit}\t(Heap Total)`);
    console.debug("      ", Math.floor(memoryUsage.external/memFactor),     `${memUnit}\t(External)`);
    console.debug("      ", Math.floor(memoryUsage.arrayBuffers/memFactor), `${memUnit}\t(Array Buffers)`);
    client.ws.shards.forEach(shard => {
      shard.ping
      console.debug("Shard:", Status[shard.status], "With ping", shard.ping, "at", new Date(shard.lastPingTimestamp), `(Shard = ${shard.id} of ${ourBucket?.totalShardCount})`);
    });
    console.debug("###########################");
    const botInfo = await fetchGatewayBotInfo(config.Token);
    const limit = botInfo.session_start_limit;
    console.debug("Auths Remaining: ", humanizeInteger(limit.remaining), "/", humanizeInteger(limit.total), " ≈ ", Math.floor(limit.remaining/limit.total*10000)/100, "%");
    console.debug("      Resets in: ", ...humanizeMillisForDebug(limit.reset_after));
    console.debug("###########################");
    console.debug("###########################");
  
  }
}

doInit();