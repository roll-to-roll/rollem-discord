import { OTel_Processor_Bundle, OTel_Processor_Source } from "../../processor.base";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { BatchLogRecordProcessor, BufferConfig as LogsBufferConfig } from "@opentelemetry/sdk-logs";
import { BatchSpanProcessor, BufferConfig as TraceBufferConfig } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter} from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPGRPCExporterConfigNode } from "@opentelemetry/otlp-grpc-exporter-base";
import { OTLPMetricExporterOptions } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { ExporterConfig, PrometheusExporter } from '@opentelemetry/exporter-prometheus';


/** Generates unified config for AzureMonitor. */
export class OTel_Exporter_Prometheus extends OTel_Processor_Source<typeof OTel_Exporter_Prometheus> {
  constructor(
    public otlpGrpcConfig: ExporterConfig = { port: 8081 },
  ) { super(); }

  /** Generates new exporters based on current settings. */
  public makeExporters(): OTel_Processor_Bundle {
    return {
      metrics: [new PrometheusExporter(this.otlpGrpcConfig)],
      tracer: [],
      logs: [],
    };
  };
}