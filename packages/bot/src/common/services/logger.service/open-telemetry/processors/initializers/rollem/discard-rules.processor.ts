import { OTel } from "@common/services/logger.service/open-telemetry/config";
import { RollemContext } from "./context";
import { Context, Span, TraceFlags } from "@opentelemetry/api";
import { ReadableSpan, SpanProcessor } from "@opentelemetry/sdk-trace-base";
import { contextManager } from "@common/services/logger.service/open-telemetry/init.context";

/** Discards messages based on {@link RollemContext} state. */
export class OTel_Processor_RollemContext_DiscardRules implements SpanProcessor {
  constructor() {}
  async forceFlush(): Promise<void> {}
  async shutdown(): Promise<void> {}
  
  /** If it's a rollem log and it's us or a bot, drop it. */
  public onStart(span: Span, parentContext: Context): void {
    const context = span.spanContext();
    const rollemContext = RollemContext.get(parentContext);
    let shouldDrop = false;
    if (!!rollemContext?.djs) {
      if (rollemContext.djs.isRollem) {
        shouldDrop = true;
      }

      if (rollemContext.djs.isBot) {
        shouldDrop = true;
      }
    }

    if (shouldDrop) {
      context.traceFlags = TraceFlags.NONE;
    }
  }

  /** If it's a rollem log that we haven't replied to, drop it. */
  public onEnd(span: ReadableSpan): void {
    const context = span.spanContext();
    
    let shouldDrop = false;
    if (RollemContext.hasRollemContext(span.attributes)) {
      if (!RollemContext.isRecentlyReplied(span.attributes)) {
        shouldDrop = true;
      }
    }

    if (shouldDrop) {
      context.traceFlags = TraceFlags.NONE;
    }
  }
}