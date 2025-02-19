import { OTel_Processor_Bundle, OTel_Processor_Source } from "../../processor.base";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { BatchLogRecordProcessor, BufferConfig as LogsBufferConfig } from "@opentelemetry/sdk-logs";
import { BatchSpanProcessor, BufferConfig as TraceBufferConfig } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter} from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPGRPCExporterConfigNode } from "@opentelemetry/otlp-grpc-exporter-base";
import { OTLPMetricExporterOptions } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';


/** Generates unified config for AzureMonitor. */
export class OTel_Exporter_OTLP_GRPC extends OTel_Processor_Source<typeof OTel_Exporter_OTLP_GRPC> {

  constructor(
    public otlpGrpcConfig: OTLPGRPCExporterConfigNode = {
      // url: 'localhost:4317'
    },
    public otlpGrpcMetricExporterConfig: OTLPMetricExporterOptions = {},
    /** Buffer config for Traces. See https://www.npmjs.com/package/@azure/monitor-opentelemetry-exporter/v/1.0.0-alpha.20241227.1 */
    public traceBufferConfig: TraceBufferConfig = { exportTimeoutMillis: 15000, maxExportBatchSize: 1000 },
  
    /** Buffer config for Traces. See https://www.npmjs.com/package/@azure/monitor-opentelemetry-exporter/v/1.0.0-alpha.20241227.1 */
    public logsBufferConfig: LogsBufferConfig = { exportTimeoutMillis: 15000, maxExportBatchSize: 1000 },
  ) { super(); }

  /** Generates new exporters based on current settings. */
  public makeExporters(): OTel_Processor_Bundle {
    return {
      metrics: [new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter({ ...this.otlpGrpcConfig, ...this.otlpGrpcMetricExporterConfig }) })],
      tracer: [new BatchSpanProcessor(new OTLPTraceExporter({ ...this.otlpGrpcConfig }), this.traceBufferConfig)],
      logs: [new BatchLogRecordProcessor(new OTLPLogExporter({ ...this.otlpGrpcConfig }), this.logsBufferConfig)],
    };
  };
}