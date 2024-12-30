import { RollemContext } from "./context";
import { Context, Span, TraceFlags } from "@opentelemetry/api";
import { ReadableSpan, SpanProcessor } from "@opentelemetry/sdk-trace-base";

/** Discards messages based on {@link RollemContext} state. */
export class OTel_Processor_RollemContext_DiscardRules implements SpanProcessor {
  constructor() {}
  async forceFlush(): Promise<void> {}
  onEnd(_: ReadableSpan): void {}
  async shutdown(): Promise<void> {}
  
  onStart(span: Span, parentContext: Context): void {
    const context = span.spanContext();
    const rollemContext = RollemContext.get(parentContext);
    let shouldKeep = true;
    if (!!rollemContext?.djs) {
      if (rollemContext.djs.isRollem) {
        shouldKeep = false;
      }

      if (rollemContext.djs.isBot) {
        shouldKeep = false;
      }
    }

    if (!shouldKeep) {
      context.traceFlags = TraceFlags.NONE;
    }
  }
}