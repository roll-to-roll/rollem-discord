import { DiscordBehaviorBase } from "./discord.behavior.base";
import util from "util";
import { Client } from "discord.js";
import { Logger, LoggerCategory } from "@common/services/logger.service/logger.service";
import { Injectable } from "injection-js";
import { PromLogger } from "@common/services/prom-logger.service/prom-logger.service";
import { DiscordClientService } from "@root/platform/discord/client/discord-client.service";

// TODO: there's got to be a cleaner way to handle this, but this seems to make it more resilient.

/**
 * Causes this client to die when an unknown error occurs.
 * When supervised, the process should be immediately restarted.
 */
@Injectable()
export class DieOnErrorBehavior extends DiscordBehaviorBase {
  constructor(
    clientService: DiscordClientService,
    promLogger: PromLogger,
    logger: Logger,
  ) { super(clientService, promLogger, logger); }
  
  protected async register() {
    this.client.on('error', error => this.handleClientError(error));
    process.on("exit", code => this.handleExit(code));
    process.on("uncaughtException", error => this.handleUncaughtError(error));
    process.on("unhandledRejection", (reason, promise) => this.handleUnhandledRejection(reason, promise));
  }

  /** Handles errors emitted by the client. */
  private handleClientError(error: Error) {
    if (error && typeof(error.message) === "string") {
      try {
        let ignoreError = error.message.includes('write EPIPE');
        if (ignoreError) {
          this.logger.trackSimpleEvent(LoggerCategory.SystemEvent, "known error - " + error.message, { reason: util.inspect(error)});
          return;
        }
      } catch { }
    }
  
    this.logger.trackSimpleEvent(LoggerCategory.SystemEvent, "unknown error", { reason: util.inspect(error) });
    this.logger.flush();
  
    process.exit(0);
  }

  /** Handles otherwise-unhandled errors. */
  private handleUncaughtError(error: Error) {
    this.logger.trackError(LoggerCategory.SystemEvent, `uncaught error - ${error.name}`, error);
    this.logger.flush();
    process.exit(0);
  }

  /** Handles otherwise-unhandled errors. */
  private handleUnhandledRejection(reason: {} | null | undefined, promise: Promise<any>) {
    if (reason instanceof Error)
      this.logger.trackError(LoggerCategory.SystemEvent, `unhandled rejection - ${reason}`, reason);
    this.logger.trackError(LoggerCategory.SystemEvent, `unhandled rejection - ${reason} - ${util.inspect(reason)}`);

    this.logger.flush();
    process.exit(0);
  }

  
  /** Fired on exit. */
  private handleExit(code: number) {
    this.logger.trackSimpleEvent(LoggerCategory.SystemEvent, `exiting - ${code}`);
    this.logger.flush();
  }
}