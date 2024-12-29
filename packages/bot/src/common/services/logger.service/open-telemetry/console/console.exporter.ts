import { OTel_Processor_ExporterBundle, OTel_Processor_Source } from "@common/services/logger.service/open-telemetry/common/exporter-base";
import { ConsoleLogRecordExporter, SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { ConsoleMetricExporter, PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { ConsoleSpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";

/** Generates unified config for AzureMonitor. */
export class OTel_Console extends OTel_Processor_Source<typeof OTel_Console> {

  constructor(
  ) { super(); }

  /** Generates new exporters based on current settings. */
  public makeExporters(): OTel_Processor_ExporterBundle {
    return {
      metrics: [new PeriodicExportingMetricReader({ exporter: new ConsoleMetricExporter() })],
      tracer: [new SimpleSpanProcessor(new ConsoleSpanExporter())],
      logs: [new SimpleLogRecordProcessor(new ConsoleLogRecordExporter())],
    };
  };
}