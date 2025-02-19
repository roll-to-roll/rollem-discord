import { DiscordBehaviorBase } from "./discord.behavior.base";
import util from "util";
import { Client } from "discord.js";
import { Logger, LoggerCategory } from "@common/services/logger.service/logger.service";
import { Injectable } from "injection-js";
import { PromLogger } from "@common/services/prom-logger.service/prom-logger.service";
import { DiscordClientService } from "@root/platform/discord/client/discord-client.service";

// TODO: there's got to be a cleaner way to handle this, but this seems to make it more resilient.

/**
 * Causes this client to die when a disconnect event occurs.
 * When supervised, the process should be immediately restarted.
 */
@Injectable()
export class DieOnDisconnectBehavior extends DiscordBehaviorBase {
  constructor(
    client: DiscordClientService,
    promLogger: PromLogger,
    logger: Logger,
  ) { super(client, promLogger, logger); }

  protected async register() {
    this.client.on('disconnect', (f) => {
      this.logger.trackSimpleEvent(LoggerCategory.SystemEvent, "disconnect", { reason: util.inspect(f) });
      this.logger.flush();
      process.exit(0);
    });
  }
}