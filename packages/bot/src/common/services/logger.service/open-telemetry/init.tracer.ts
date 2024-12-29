import { THROW } from "@common/errors/do-error";
import { OTel_Exporter_AzureMonitor } from "@common/services/logger.service/open-telemetry/processors/exporters/azure-monitor.exporter";
import { OTel } from "@common/services/logger.service/open-telemetry/config";
import { OTel_Exporter_Console } from "@common/services/logger.service/open-telemetry/processors/exporters/console.exporter";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { OTel_Exporter_OTLP_GRPC } from "@common/services/logger.service/open-telemetry/processors/exporters/otlp-grpc.exporter";
import { OTel_Initializer_Baggage } from "@common/services/logger.service/open-telemetry/processors/initializers/rollem-context";

export const tracerProvider = new NodeTracerProvider({
  resource: OTel.resource,
  spanProcessors: [
    ...OTel_Initializer_Baggage.instance.exporters.tracer,
    ...OTel_Exporter_AzureMonitor.instance.exporters.tracer,
    ...OTel_Exporter_Console.instance.exporters.tracer,
    ...OTel_Exporter_OTLP_GRPC.instance.exporters.tracer,
  ],
});

// tracerProvider.register(contextManager)

OTel.api.trace.setGlobalTracerProvider(tracerProvider) || THROW(new Error("Unable to set Global Trace Provider"));