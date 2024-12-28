
import { CTX } from "@common/services/logger.service/telemetry.service";
import { Context, context, trace } from "@opentelemetry/api";
import { ENV_CONFIG } from "@root/platform/env-config.service";
import { Awaitable, Client, ClientEvents, ClientOptions, version } from "discord.js";

const tracer = trace.getTracer(
  'discord-client|all',
  version,
);

export class DiscordClientWithTelemetry extends Client<boolean> {
  public on<TEvent extends keyof ClientEvents>(event: TEvent, listener: (...args: ClientEvents[TEvent]) => Awaitable<void>): this {
    return super.on(event, async (...args: ClientEvents[TEvent]) => {
      const ctx = this.createContext(context.active(), event, ...args);
      await context.with(ctx, async () => {
        await tracer.startActiveSpan(`on(${event})`, async span => {
          await listener(...args);
          span.end();
        })
      });
    });
  }

  private createContext<TEvent extends keyof ClientEvents>(ctx: Context, event: TEvent, ...args: ClientEvents[TEvent]): Context {
    ctx = ctx.setValue(CTX.EVENT, event);
    switch (event) {
      case 'messageCreate':
        const message = (args as ClientEvents['messageCreate'])?.[0];
        return ctx
          .setValue(CTX.MESSAGE, message.id)
          .setValue(CTX.AUTHOR, message.author.id)
          .setValue(CTX.CHANNEL, message.channelId)
          .setValue(CTX.GUILD, message.guildId)
          .setValue(CTX.SHARDSET, `${message.guild?.shardId ?? 0}-of-${this.options.shardCount}`)
          .setValue(CTX.SHARD, `${message.guild?.shardId ?? 0}-of-${this.options.shardCount}`);
      default:
        return ctx;
    }
  }
}