// these must be the first imported items
import "reflect-metadata";
import { TelemetryService } from "@common/services/logger.service/telemetry.service";
import nodeFetch from 'node-fetch';
global.fetch = nodeFetch as any;

import { OriginalConfig } from "@root/platform/original-config.service";

import { InjectorWrapper } from "@common/util/injector-wrapper";
import { Storage } from "@rollem/common";
import { PromLogger } from "@common/services/prom-logger.service/prom-logger.service";
import { Logger } from "@common/services/logger.service/logger.service";
import { ChangeLog } from "@common/services/changelog/changelog";
import { RollemRandomSources } from "@bot/lib/rollem-random-sources.service";
import { RepliedMessageCache } from "@bot/lib/replied-message-cache.service";
import { Parsers } from "@common/services/parsers.service";
import { RollemParserV1, RollemParserV1Beta, RollemParserV2 } from "@rollem/language";
import { ClientConfigService } from "@root/platform/discord/client/client-config.service";
import { DiscordClientService } from "@root/platform/discord/client/discord-client.service";
import { DeadmanSwitchBehavior } from "@bot/behaviors/deadman-switch";
import { DieOnDisconnectBehavior } from "@bot/behaviors/die-on-disconnect.behavior";
import { DieOnErrorBehavior } from "@bot/behaviors/die-on-error.behavior";
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
import { fetchGatewayBotInfo } from "@root/platform/discord/startup";
import { humanizeInteger } from "@common/util/number-with-commas";
import { humanizeMillisForDebug } from "@common/util/humanize-duration";
import { CacheService } from "@root/platform/discord/client/cache/cache.service";
import { EnvConfig } from "@root/platform/env-config.service";
import { PromLoggerApi } from "@common/services/prom-logger.service/prom-logger-api.service";

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
    ...EnvConfig.providers,
    TelemetryService,
    PromLogger,
    // PromLoggerApi,
    Logger,
    ChangeLog,
    RollemRandomSources,
    OriginalConfig,
    { provide: Storage, useValue: new Storage() },
    PromLoggerApi,
    RollemParserV1,
    RollemParserV1Beta,
    RollemParserV2,
    Parsers,
    RepliedMessageCache,
    ClientConfigService,
    CacheService,
    // { provide: GlobalAppState, useValue: GlobalAppState.Instance },
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
  
  const config = intermediateDiscordScope.get(OriginalConfig);
  const ourBucket = intermediateDiscordScope.get(ClientConfigService).ourBucket;
  const client = intermediateDiscordScope.get(DiscordClientService).client;
  const cache = intermediateDiscordScope.get(CacheService);
  // client.on('messageCreate', async message => {
  //   console.log("==================== message");
  //   const author = await message.guild?.members.fetchMe();
  //   const authorRoleNames = author?.roles.cache.map(r => r.name) ?? [];
  //   console.debug(authorRoleNames);
  //   console.log("==================== /message")
  // });
  
  setInterval(async () => await printUsage(), 10_000);
  
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
    console.debug("Cached Guilds:", client.guilds.cache.size);
    console.debug("###########################");
    console.debug("###########################");
    console.debug("###########################");
  
  }
}

doInit();