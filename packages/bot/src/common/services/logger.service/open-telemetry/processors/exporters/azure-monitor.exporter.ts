import { AzureMonitorExporterOptions, AzureMonitorLogExporter, AzureMonitorMetricExporter, AzureMonitorTraceExporter } from "@azure/monitor-opentelemetry-exporter";
import { OTel_Processor_Bundle, OTel_Processor_Source } from "../../processor.base";
import { BatchLogRecordProcessor, BufferConfig as LogsBufferConfig } from "@opentelemetry/sdk-logs";
import { BatchSpanProcessor, BufferConfig as TraceBufferConfig } from "@opentelemetry/sdk-trace-base";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { ENV_CONFIG } from "@root/platform/env-config.service";

/** Generates unified config for AzureMonitor. */
export class OTel_Exporter_AzureMonitor extends OTel_Processor_Source<typeof OTel_Exporter_AzureMonitor> {
  // static #instance?: OTel_AzureMonitor;

  // /** Configured instance (or default). Must `set` before ever retrieving to initialize custom from . */
  // public static get instance(): OTel_AzureMonitor {
  //   OTel_AzureMonitor.#instance ??= new OTel_AzureMonitor();
  //   return OTel_AzureMonitor.#instance;
  // }
  // public static set instance(value: OTel_AzureMonitor) {
  //   if (!!OTel_AzureMonitor.#instance) {
  //     throw new Error("Instance must be set before it is ever retrieved.");
  //   }

  //   OTel_AzureMonitor.#instance = value;
  // }

  constructor(
    /** Shared configuration for Azure Monitor / App Insights exporters. */
    public exporterOptions: AzureMonitorExporterOptions = {
      connectionString: ENV_CONFIG.appInsightsConnectionString,
      disableOfflineStorage: false,
      storageDirectory: './azure-monitor-logs/',
    },

    /** Buffer config for Traces. See https://www.npmjs.com/package/@azure/monitor-opentelemetry-exporter/v/1.0.0-alpha.20241227.1 */
    public traceBufferConfig: TraceBufferConfig = { exportTimeoutMillis: 15000, maxExportBatchSize: 1000 },
  
    /** Buffer config for Traces. See https://www.npmjs.com/package/@azure/monitor-opentelemetry-exporter/v/1.0.0-alpha.20241227.1 */
    public logsBufferConfig: LogsBufferConfig = { exportTimeoutMillis: 15000, maxExportBatchSize: 1000 },
  ) { super(); }

  /** Generates new exporters based on current settings. */
  public makeExporters(): OTel_Processor_Bundle {
    return {
      metrics: [new PeriodicExportingMetricReader({ exporter: new AzureMonitorMetricExporter(this.exporterOptions) })],
      tracer: [new BatchSpanProcessor(new AzureMonitorTraceExporter(this.exporterOptions), this.traceBufferConfig)],
      logs: [new BatchLogRecordProcessor(new AzureMonitorLogExporter(this.exporterOptions), this.logsBufferConfig)],
    };
  };
}