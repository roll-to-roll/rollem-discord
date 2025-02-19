import { OTel_Processor_Bundle, OTel_Processor_Source } from "../../processor.base";
import { ConsoleLogRecordExporter, SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { ConsoleMetricExporter, PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { ConsoleSpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";

/** Generates unified config for AzureMonitor. */
export class OTel_Exporter_Console extends OTel_Processor_Source<typeof OTel_Exporter_Console> {

  constructor(
  ) { super(); }

  /** Generates new exporters based on current settings. */
  public makeExporters(): OTel_Processor_Bundle {
    return {
      metrics: [], // [new PeriodicExportingMetricReader({ exporter: new ConsoleMetricExporter() })],
      tracer: [], // [new SimpleSpanProcessor(new ConsoleSpanExporter())],
      logs: [], // [new SimpleLogRecordProcessor(new ConsoleLogRecordExporter())],
    };
  };
}