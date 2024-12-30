import { RollemContext } from "./context";
import { Context, Span, TraceFlags } from "@opentelemetry/api";
import { ReadableSpan, SpanProcessor } from "@opentelemetry/sdk-trace-base";
import { chain } from "lodash";

/** Applies {@link RollemContext} state to messages. */
export class OTel_Processor_RollemContext_CopyToSpan implements SpanProcessor {
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

    const definedPairs = chain(rollemContext?.djs)
      .toPairs()
      .map(([k, v]) => [`r.${k}`, v])
      .filter(([k, v]) => v != undefined)
      .fromPairs()
      .value()
    span.setAttributes(definedPairs);
  }
}