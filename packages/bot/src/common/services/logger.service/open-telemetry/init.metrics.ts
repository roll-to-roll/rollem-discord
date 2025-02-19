import { OTel_Exporter_AzureMonitor } from "@common/services/logger.service/open-telemetry/processors/exporters/azure-monitor.exporter";
import { OTel } from "@common/services/logger.service/open-telemetry/config";
import { OTel_Exporter_Console } from "@common/services/logger.service/open-telemetry/processors/exporters/console.exporter";
import { MeterProvider } from "@opentelemetry/sdk-metrics";
import { OTel_Exporter_OTLP_GRPC } from "@common/services/logger.service/open-telemetry/processors/exporters/otlp-grpc.exporter";
import { OTel_Exporter_Prometheus } from "@common/services/logger.service/open-telemetry/processors/exporters/prometheus.exporter";

export const meterProvider = new MeterProvider({
  resource: OTel.resource,
  readers: [
    // ...OTel_Exporter_AzureMonitor.instance.exporters.metrics,
    ...OTel_Exporter_Console.instance.exporters.metrics,
    ...OTel_Exporter_Prometheus.instance.exporters.metrics,
    // ...OTel_Exporter_OTLP_GRPC.instance.exporters.metrics,
  ]
});

OTel.api.metrics.setGlobalMeterProvider(meterProvider);