
import { OTel } from "@common/services/logger.service/open-telemetry/config";
import { RollemContext } from "@common/services/logger.service/open-telemetry/processors/initializers/rollem";
import { tryCatchFinally } from "@common/services/logger.service/open-telemetry/utils";
import { BorgName } from "@common/util/borg-designation";
import { Tracing } from "@common/util/tracing";
import { Context, SpanKind, SpanStatusCode, context } from "@opentelemetry/api";
import { ENV_CONFIG } from "@root/platform/env-config.service";
import { Awaitable, Client, ClientEvents, ClientOptions, Collection, version } from "discord.js";

const tracer = OTel.api.trace.getTracer(
  'discord-client|all',
  version,
);

export type ListenerFunc<TEvent extends keyof ClientEvents = keyof ClientEvents> = (...args: ClientEvents[TEvent]) => Awaitable<void>;

export class DiscordClientWithTelemetry extends Client<boolean> {
  private _root?: Collection<keyof ClientEvents, ListenerFunc<any>>;

  private _registered?: Collection<keyof ClientEvents, Collection<ListenerFunc<any>, string>>;

  public constructor(options: ClientOptions) {
    super(options);
  }

  public get root() {
    return (this._root ??= new Collection<keyof ClientEvents, ListenerFunc<any>>());
  }

  public get registered() {
    return (this._registered ??= new Collection<keyof ClientEvents, Collection<ListenerFunc<any>, string>>());
  }

  public on<TEvent extends keyof ClientEvents>(event: TEvent, listener: ListenerFunc<TEvent>): this {
    if (!this.root) { debugger; }
    // console.debug("#### CreateContext", event);
    this.root.ensure(event, (_key, _coll) => {
      const rootEventFn = async (...args: ClientEvents[TEvent]) => await this.onInternalRoot(event, ...args);
      super.on(event, rootEventFn);
      return rootEventFn;
    });

    const stack = Tracing.getCaller();
    const registrant = stack?.callerId ?? "unknown";

    this.registered
      .ensure(event, (_key, _coll) => new Collection<ListenerFunc<TEvent>, string>())
      .set(listener, registrant);

    return this;
  }

  private async onInternalRoot<TEvent extends keyof ClientEvents>(event: TEvent, ...args: ClientEvents[TEvent]): Promise<void> {
    await tracer.startActiveSpan(`on(${event})`, { kind: SpanKind.SERVER, root: true }, this.createContext(event, ...args),
      async (span) => {
        const listeners = [...this.registered.get(event)?.entries() ?? []];
        const promises = listeners.map(listener => this.onInternalEach(listener[0], listener[1], event, ...args));
        const result = await Promise.allSettled(promises);
        const allGood = result.every(r => r.status == "fulfilled");
        const finalStatus = allGood ? SpanStatusCode.OK : SpanStatusCode.ERROR;
        span.setStatus({ code: finalStatus }).end();
      });
  }

  private async onInternalEach<TEvent extends keyof ClientEvents>(listener: ListenerFunc<TEvent>, listenerRegistrant: string, event: TEvent, ...args: ClientEvents[TEvent]): Promise<void> {
    await tracer.startActiveSpan(
      `on(${event}) ${listenerRegistrant}`,
      { kind: SpanKind.INTERNAL },
      this.createContext(event, ...args),
      tryCatchFinally(async (_span) => await listener(...args)));
  }

  private createContext<TEvent extends keyof ClientEvents>(event: TEvent, ...args: ClientEvents[TEvent]): Context {
    switch (event) {
      case 'messageCreate':
        const message = (args as ClientEvents['messageCreate'])?.[0];
        const messageContextLabels = {
          isBot: message.author.bot,
          isRollem: message.author.id === this.application?.client.user.id,
          isDM: message.channel.isDMBased(),
          message: message.id,
          author: message.author.id,
          channel: message.channelId,
          guild: message.guildId ?? undefined,
          shardSet: ENV_CONFIG.shardSetInfo.name,
          event: event,
          shard: BorgName.indexOfCount(
            message.guild?.shardId ?? 0,
            ENV_CONFIG.shardSetInfo.totalShards),
        };
        // console.debug("#### CreateContext", event, messageContextLabels, message.content);
        return RollemContext.set(messageContextLabels);
      default:
        // console.debug("#### CreateContext", event);
        return context.active();
    }
  }
}
