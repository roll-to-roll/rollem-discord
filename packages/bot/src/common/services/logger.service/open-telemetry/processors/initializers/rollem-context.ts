import { Context, Span } from "@opentelemetry/api";
import { ReadableSpan, SpanProcessor } from "@opentelemetry/sdk-trace-base";
import { chain, cloneDeep, fromPairs } from "lodash";
import { OTel_Processor_Bundle, OTel_Processor_Source } from "@common/services/logger.service/open-telemetry/processor.base";
import { OTel } from "@common/services/logger.service/open-telemetry/config";
import { api } from "@opentelemetry/sdk-node";
import { THROW } from "@common/errors/do-error";
import { RollemError } from "@common/errors";


export class RollemContext {
  public static ROLLEM = api.createContextKey('djs-rollem');

  constructor(
    public readonly djs: {
      shardSet?: string,
      shard?: string,
      guild?: string,
      channel?: string,
      message?: string,
      author?: string,
      event?: string,
    }
  ) {}

  public static isRollemContext(item: unknown): item is RollemContext {
    if (typeof item !== 'object') return false;
    if (item instanceof RollemContext) { return true; }
    return false;
  }

  public static set(initialVals: RollemContext['djs'], context: api.Context = api.context.active()): api.Context {
    return context.setValue(this.ROLLEM, new RollemContext(cloneDeep(initialVals)));
  }

  public static get(context: api.Context = api.context.active()): RollemContext | undefined{
    const result = context.getValue(this.ROLLEM);
    if (this.isRollemContext(result)) { return result; }
    return undefined;
  } 

  public static getOrThrow(context: api.Context = api.context.active()): RollemContext {
    return this.get(context) || THROW(new RollemError({ message: "Could not retrieve RollemContext", context }));
  } 
}

class PutBaggageOnTheSpans implements SpanProcessor {
  constructor() {}
  async forceFlush(): Promise<void> {}
  onEnd(_: ReadableSpan): void {}
  async shutdown(): Promise<void> {}
  
  onStart(span: Span, parentContext: Context): void {
    const rollemContext = RollemContext.get(parentContext);
    const definedPairs = chain(rollemContext?.djs).toPairs().filter(([k, v]) => v != undefined).fromPairs().value()
    span.setAttributes(definedPairs);
  }
}

/** Generates unified config for AzureMonitor. */
export class OTel_Initializer_Baggage extends OTel_Processor_Source<typeof OTel_Initializer_Baggage> {

  constructor(
  ) { super(); }

  /** Generates new exporters based on current settings. */
  public makeExporters(): OTel_Processor_Bundle {
    return {
      metrics: [], // [new PeriodicExportingMetricReader({ exporter: new ConsoleMetricExporter() })],
      tracer: [new PutBaggageOnTheSpans()],
      logs: [], // [new SimpleLogRecordProcessor(new ConsoleLogRecordExporter())],
    };
  };
}