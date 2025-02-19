import { Resource } from "@opentelemetry/resources";
import { ENV_CONFIG } from "@root/platform/env-config.service";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_SERVICE_INSTANCE_ID,
} from '@opentelemetry/semantic-conventions';
import { metrics, trace, context, propagation } from "@opentelemetry/api";
import { logs } from "@opentelemetry/api-logs";
import { api as sdkApi } from "@opentelemetry/sdk-node";

export namespace OTel {
  /** Open Telemetry Resource Model */
  export const resource = new Resource({
    [ATTR_SERVICE_NAME]: ENV_CONFIG.openTelemetry.serviceName,
    [ATTR_SERVICE_VERSION]: ENV_CONFIG.openTelemetry.serviceVersion,
    // TODO: Figure out what this INSTANCE_ID field is supposed to be now
    [SEMRESATTRS_SERVICE_INSTANCE_ID]: ENV_CONFIG.openTelemetry.ServiceInstanceId,
  });

  /** Global OpenTelemetry API aliases.  */
  export const api = {
    /** Entrypoint for metrics API. (Global OpenTelemetry API alias) */
    metrics: metrics,
    trace: trace,
    logs: logs,
    context: context,
    propagation: propagation,
    createContextKey: sdkApi.createContextKey,
  }
}


// const sdkConfig: Partial<NodeSDKConfiguration> = {
//   resource: resource,
//   contextManager,
//   spanProcessors: [
//     new BatchSpanProcessor(new AzureMonitorTraceExporter(azureMonitorOptions), { exportTimeoutMillis: 15000, maxExportBatchSize: 1000, }),
//     new SimpleSpanProcessor(new ConsoleSpanExporter()),
//   ],
//   metricReader:  new PeriodicExportingMetricReader({ exporter: new AzureMonitorMetricExporter(azureMonitorOptions)}),
//   logRecordProcessors: [
//     new BatchLogRecordProcessor(new AzureMonitorLogExporter(azureMonitorOptions)),
//     new SimpleLogRecordProcessor(new ConsoleLogRecordExporter()),
//   ],
//   instrumentations: [],
// };
// const sdk = new NodeSDK(sdkConfig);
// sdk.start();