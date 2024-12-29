import { THROW } from "@common/errors/do-error";
import { OTel_AzureMonitor } from "@common/services/logger.service/open-telemetry/application-insights/azure-monitor.exporter";
import { OTel } from "@common/services/logger.service/open-telemetry/config";
import { OTel_Console } from "@common/services/logger.service/open-telemetry/console/console.exporter";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

export const tracerProvider = new NodeTracerProvider({
  spanProcessors: [
    ...OTel_AzureMonitor.instance.exporters.tracer,
    ...OTel_Console.instance.exporters.tracer
  ],
});

// tracerProvider.register(contextManager)

OTel.api.trace.setGlobalTracerProvider(tracerProvider) || THROW(new Error("Unable to set Global Trace Provider"));