import { OTel_AzureMonitor } from "@common/services/logger.service/open-telemetry/application-insights/azure-monitor.exporter";
import { OTel } from "@common/services/logger.service/open-telemetry/config";
import { OTel_Console } from "@common/services/logger.service/open-telemetry/console/console.exporter";
import { MeterProvider } from "@opentelemetry/sdk-metrics";

export const meterProvider = new MeterProvider({
  resource: OTel.resource,
  readers: [
    ...OTel_AzureMonitor.instance.exporters.metrics,
    ...OTel_Console.instance.exporters.metrics,
  ]
});

OTel.api.metrics.setGlobalMeterProvider(meterProvider);