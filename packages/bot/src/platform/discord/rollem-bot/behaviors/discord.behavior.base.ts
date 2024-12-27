import { Client } from "discord.js";
import { Logger, LoggerCategory } from "@common/services/logger.service/logger.service";
import { ClassProvider, Injectable } from "injection-js";
import { PromLogger } from "@common/services/prom-logger.service/prom-logger.service";
import { Newable } from "@common/util/types/utility-types";
import { DiscordClientService } from "@root/platform/discord/client/discord-client.service";
import { IInitializeable } from "@common/util/injector-wrapper";

/** A base for behaviors to be applied to a discord client. */
@Injectable()
export abstract class DiscordBehaviorBase implements IInitializeable {
  public static asBehavior<T extends DiscordBehaviorBase>(this: Newable<T>): ClassProvider { return { provide: DiscordBehaviorBase, useClass: this, multi: true }; }
  
  protected get client(): Client { return this.clientService.client; }
  
  constructor(
    protected readonly clientService: DiscordClientService,
    protected readonly promLogger: PromLogger,
    protected readonly logger: Logger,
  ) { }
  
  /** Applies the behavior to the given client. */
  public async apply(): Promise<void> {
    this.logger.trackSimpleEvent(LoggerCategory.BehaviorRegistration, `Registering Behavior: ${this.constructor.name}`)
    await this.register();
  }

  /** Called on initialization to register any callbacks with the discord client. */
  protected abstract register(): Promise<void>;

  public initialize(): Promise<void> {
    return this.apply();
  }

  /** Handle an unknown rejection. */
  protected handleRejection(label: string, error: Error) {
    this.logger.trackError(LoggerCategory.SystemEvent, label, error);
  }
  
  /** Handle a rejected send request. */
  protected handleSendRejection(message) {
    this.logger.trackMessageEvent(LoggerCategory.SystemEvent, "Missing send permission", message);
  }
}