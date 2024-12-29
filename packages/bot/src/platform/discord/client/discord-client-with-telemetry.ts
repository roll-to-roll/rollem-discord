
import { OTel } from "@common/services/logger.service/open-telemetry/config";
import { RollemContext } from "@common/services/logger.service/open-telemetry/processors/initializers/rollem-context";
import { BorgName } from "@common/util/borg-designation";
import { Context, SpanKind, SpanStatusCode, context, trace } from "@opentelemetry/api";
import { ENV_CONFIG } from "@root/platform/env-config.service";
import { Awaitable, Client, ClientEvents, ClientOptions, version } from "discord.js";

const tracer = OTel.api.trace.getTracer(
  'discord-client|all',
  version,
);

export class DiscordClientWithTelemetry extends Client<boolean> {
  public on<TEvent extends keyof ClientEvents>(event: TEvent, listener: (...args: ClientEvents[TEvent]) => Awaitable<void>): this {
    // return super.on(event, async (...args: ClientEvents[TEvent]) => {
    //   const ctx = this.createContext(context.active(), event, ...args);
    //   await context.with(ctx, async () => {
    //     await tracer.startActiveSpan(`on(${event})`, { kind: SpanKind.SERVER, root: true }, async span => {
    //       await listener(...args);
    //       span.setStatus({ code: SpanStatusCode.OK, message: "done?" }).end();
    //     });
    //   })
    // });
    return super.on(event, async (...args: ClientEvents[TEvent]) => {
      await tracer.startActiveSpan(
        `on(${event})`, { kind: SpanKind.SERVER, root: true },
        this.createContext(event, ...args),
        async span => {
        await listener(...args);
        span.setStatus({ code: SpanStatusCode.OK, message: "done?" }).end();
      });
    });
  }

  private createContext<TEvent extends keyof ClientEvents>(event: TEvent, ...args: ClientEvents[TEvent]): Context {
    switch (event) {
      case 'messageCreate':
        const message = (args as ClientEvents['messageCreate'])?.[0];
        return RollemContext.set({
          message: message.id,
          author: message.author.id,
          channel: message.channelId,
          guild: message.guildId ?? undefined,
          shardSet: ENV_CONFIG.shardSetInfo.name,
          shard: BorgName.indexOfCount(
            message.guild?.shardId ?? 0,
            ENV_CONFIG.shardSetInfo.totalShards),
        });
      default:
        return context.active();
    }
  }
}