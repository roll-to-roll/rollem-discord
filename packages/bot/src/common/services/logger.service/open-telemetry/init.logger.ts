import { OTel_AzureMonitor } from "@common/services/logger.service/open-telemetry/application-insights/azure-monitor.exporter";
import { OTel } from "@common/services/logger.service/open-telemetry/config";
import { OTel_Console } from "@common/services/logger.service/open-telemetry/console/console.exporter";
import { LoggerProvider } from "@opentelemetry/sdk-logs";

export const loggerProvider = new LoggerProvider({
  resource: OTel.resource,
});
const logProcessors = [
  ...OTel_AzureMonitor.instance.exporters.logs,
  ...OTel_Console.instance.exporters.logs,
];
logProcessors.forEach(logProcessor => loggerProvider.addLogRecordProcessor(logProcessor));

// Register logger Provider as global
OTel.api.logs.setGlobalLoggerProvider(loggerProvider);
