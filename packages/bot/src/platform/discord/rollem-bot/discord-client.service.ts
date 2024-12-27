import { Inject, Injectable } from "injection-js";
import { DiscordClientConfigService } from "./discord-client-config.service";
import { Logger, LoggerCategory } from "@common/services/logger.service/logger.service";
import { BitFieldResolvable, Client, ClientOptions, GatewayIntentsString, IntentsBitField, Partials } from "discord.js";
import { defaults } from "lodash";
import { IInitializeable } from "@common/util/injector-wrapper";
import { Config } from "@bot/discord-config.service";
import { DiscordBehaviorBase } from "@bot/behaviors/discord.behavior.base";
import { GLOBAL_STATE } from "@root/platform/discord/global-state";

@Injectable()
export class DiscordClientService implements IInitializeable {
  public client: Client<boolean>;

  constructor(
    private readonly logger: Logger,
    private readonly clientConfig: DiscordClientConfigService,
    private readonly envConfig: Config,
  ) {
    const options = this.clientConfig.clientOptions;
    logger.trackSimpleEvent(LoggerCategory.SystemEvent, "Constructing client...");
    logger.trackSimpleEvent(LoggerCategory.SystemEvent, `Shard IDs: ${options.shards}`);
    logger.trackSimpleEvent(LoggerCategory.SystemEvent, "Shard Count: " + options.shardCount);
    // logger.trackSimpleEvent(LoggerCategory.SystemEvent, "Logging in using token: " + config.Token);

    console.debug("ClientOptions", options);
    this.client = new Client(options);
  }

  public async initialize(): Promise<void> {
    this.client.on('debug', m => console.debug(m));
    this.client.on('ready', c => {
      console.debug("======================================== READY ========================================");
      // GLOBAL_STATE.isAfterStartup = true;
    });
    await this.client.login(this.envConfig.Token);
  }
}