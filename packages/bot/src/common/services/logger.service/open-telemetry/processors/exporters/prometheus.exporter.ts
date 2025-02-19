import { OTel_Processor_Bundle, OTel_Processor_Source } from "../../processor.base";
import { ExporterConfig, PrometheusExporter } from '@opentelemetry/exporter-prometheus';


/** Generates unified config for AzureMonitor. */
export class OTel_Exporter_Prometheus extends OTel_Processor_Source<typeof OTel_Exporter_Prometheus> {
  constructor(
    public otlpGrpcConfig: ExporterConfig = { port: 8081 },
  ) { super(); }

  /** Generates new exporters based on current settings. */
  public makeExporters(): OTel_Processor_Bundle {
    return {
      metrics: [/* new PrometheusExporter(this.otlpGrpcConfig) */],
      tracer: [],
      logs: [],
    };
  };
}