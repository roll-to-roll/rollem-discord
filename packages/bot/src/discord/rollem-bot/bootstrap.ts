// Logger2 and App imports should stay at the top, as they start the metrics early.
import { PromLogger } from "./prom-logger";
import { App } from "./app";

import { Logger, LoggerCategory } from "./logger";

import { Config } from "./config";

import { Parsers } from "@bot/lib/parsers";

import { BitFieldResolvable, Client, ClientOptions, GatewayIntentBits, GatewayIntentsString, IntentsBitField, Partials } from "discord.js";
import { ChangeLog } from "./changelog";
import { DiscordBehaviorBase } from "./behaviors/discord-behavior-base";
// import assert from "assert";
import { InjectorWrapper } from "./lib/injector-wrapper";
import { Newable } from "./lib/utility-types";
import { RepliedMessageCache } from "./lib/replied-message-cache";
import { Storage } from "@rollem/common";
import { BehaviorBase } from "@common/behavior.base";
import { ClassProvider, Provider } from "injection-js";
import { BehaviorStatsBase } from "@common/stats-base";
import { DiscordStats } from "../discord-stats";
import { strict } from "assert";
import { RollemParserV1, RollemParserV1Beta, RollemParserV2 } from "@rollem/language";
import { RollemRandomSources } from "./lib/rollem-random-sources";
import { defaults } from "lodash";

// tslint:disable-next-line: no-namespace
export namespace Bootstrapper {
  /** Constructs the upper-most DI context for the bot. */
  export function buildTopLevelProviders(options?: { skipPromEndpoints: boolean}) {

    options = defaults({}, options, { skipPromEndpoints: false })!;
    // tslint:disable-next-line: no-console
    console.log("Setting up top-level DI");
    const providers: Provider[] = 
    [
      PromLogger,
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
    ];

    if (!options.skipPromEndpoints)
      providers.push(App);

    const topLevelInjector =
      InjectorWrapper.createTopLevelContext(providers);

    const promLogger = topLevelInjector.get(PromLogger);
    strict(!!promLogger, "DI failed to resolve promLogger (prometheus)");
    if (!options.skipPromEndpoints) {
      const app = topLevelInjector.get(App);
      strict(!!app, "DI failed to resolve app (express api)");
    }
    const logger = topLevelInjector.get(Logger);
    strict(!!logger, "DI failed to resolve logger");
    const config = topLevelInjector.get(Config);
    strict(!!config, "DI failed to resolve config");
    const changelog = topLevelInjector.get(ChangeLog);
    strict(!!changelog, "DI failed to resolve changelog");
    const parserv1 = topLevelInjector.get(RollemParserV1);
    strict(!!parserv1, "DI failed to resolve parser v1");
    const parserv1beta = topLevelInjector.get(RollemParserV1Beta);
    strict(!!parserv1beta, "DI failed to resolve parser v1-beta");
    const parserv2 = topLevelInjector.get(RollemParserV2);
    strict(!!parserv2, "DI failed to resolve parser v2");
    const parsers = topLevelInjector.get(Parsers);
    strict(!!parsers, "DI failed to resolve parsers");
    const repliedMessageCache = topLevelInjector.get(RepliedMessageCache);
    strict(!!repliedMessageCache, "DI failed to resolve repliedMessageCache");
    const storage = topLevelInjector.get(Storage);
    strict(!!storage, "DI failed to resolve storage");
    const rollemRandomSources = topLevelInjector.get(RollemRandomSources);
    strict(!!rollemRandomSources, "DI failed to resolve rollemRandomSources");

    return topLevelInjector;
  }

  /** Starts reading the changelog and updates logger with it. */
  export async function prepareStorage(topLevelInjector: InjectorWrapper) {
    const logger = topLevelInjector.get(Logger);
    await topLevelInjector.get(Storage).initialize();
    logger.trackSimpleEvent(LoggerCategory.SystemEvent, `Connected to postgres`);
  }

  /** Starts reading the changelog and updates logger with it. */
  export function prepareChangelog(topLevelInjector: InjectorWrapper) {
    const logger = topLevelInjector.get(Logger);
    topLevelInjector.get(ChangeLog)
      .initialize()
      .then(changelog => {
        logger.changelog = changelog;
        logger.trackSimpleEvent(
          LoggerCategory.SystemEvent,
          `Got changelog ${changelog.changelog}`,
          {
            version: changelog.version,
          })
        });
  }

  /** Creates the client and hooks it up to the logger. */
  export function prepareClient(topLevelInjector: InjectorWrapper) {
    const logger = topLevelInjector.get(Logger);
    const config = topLevelInjector.get(Config);

    logger.trackSimpleEvent(LoggerCategory.SystemEvent, "Constructing client...");
    logger.trackSimpleEvent(LoggerCategory.SystemEvent, "Shard ID: " + config.ShardId)
    logger.trackSimpleEvent(LoggerCategory.SystemEvent, "Shard Count: " + config.ShardCount)
    logger.trackSimpleEvent(LoggerCategory.SystemEvent, "Logging in using token: " + config.Token);

    const intents: BitFieldResolvable<GatewayIntentsString, number> = [
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
    ];

    const partials: Partials[] = [ Partials.Channel ];

    const clientOptions: ClientOptions =
      config.HasShardInfo
      ? {
        intents,
        partials,
        shardCount: config.ShardCount,
        shards: config.ShardId}
      : { intents, partials };
    const client = new Client(clientOptions);
    logger.client = client;

    return client;
  }

  /** Creates the DI context in which the client and its behaviors live. */
  export function createClientContext(
    topLevelInjector: InjectorWrapper,
    client: Client,
    orderedStandardBehaviors: Newable<BehaviorBase>[],
    orderedDiscordBehaviors: Newable<DiscordBehaviorBase>[]
  ) {
    topLevelInjector
      .get(Logger)
      .trackSimpleEvent(LoggerCategory.SystemEvent, "Setting up client-scoped DI");
    return topLevelInjector.createChildContext([
      { provide: Client, useValue: client },
      { provide: BehaviorStatsBase, useClass: DiscordStats },
      ...orderedStandardBehaviors.map(b =>
        <ClassProvider>{
          provide: BehaviorBase,
          useClass: b,
          multi: true,
        }),
      ...orderedDiscordBehaviors,
    ]);
  }

  /** Attaches the known behaviors to the client. */
  export async function attachBehaviorsToClient(clientLevelInjector: InjectorWrapper, orderedBehaviors: Newable<DiscordBehaviorBase>[]) {
    const logger = clientLevelInjector.get(Logger);
    logger.trackSimpleEvent(LoggerCategory.SystemEvent, "Constructing behaviors...");
    const constructedBehaviors = orderedBehaviors.map(ctor => clientLevelInjector.get(ctor) as DiscordBehaviorBase);

    logger.trackSimpleEvent(LoggerCategory.SystemEvent, "Applying behaviors...");
    await Promise.all(constructedBehaviors.map(async b => await b.apply()));
  }

  /** Starts the client. */
  export function startClient(clientLevelInjector: InjectorWrapper) {
    const logger = clientLevelInjector.get(Logger);
    const client = clientLevelInjector.get(Client);
    const config = clientLevelInjector.get(Config);

    logger.trackSimpleEvent(LoggerCategory.SystemEvent, "Ready to start. Logging in...");
    client.login(config.Token);

    logger.trackSimpleEvent(LoggerCategory.SystemEvent, "Logged in.");
  }
}
