import { OTel_Exporter_AzureMonitor } from "@common/services/logger.service/open-telemetry/processors/exporters/azure-monitor.exporter";
import { OTel } from "@common/services/logger.service/open-telemetry/config";
import { OTel_Exporter_Console } from "@common/services/logger.service/open-telemetry/processors/exporters/console.exporter";
import { LoggerProvider } from "@opentelemetry/sdk-logs";
import { OTel_Exporter_OTLP_GRPC } from "@common/services/logger.service/open-telemetry/processors/exporters/otlp-grpc.exporter";

export const loggerProvider = new LoggerProvider({
  resource: OTel.resource,
});

const logProcessors = [
  ...OTel_Exporter_AzureMonitor.instance.exporters.logs,
  ...OTel_Exporter_Console.instance.exporters.logs,
  ...OTel_Exporter_OTLP_GRPC.instance.exporters.logs,
];
logProcessors.forEach(logProcessor => loggerProvider.addLogRecordProcessor(logProcessor));

// Register logger Provider as global
OTel.api.logs.setGlobalLoggerProvider(loggerProvider);
