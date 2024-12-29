import { Resource } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_SERVICE_INSTANCE_ID,
} from '@opentelemetry/semantic-conventions';
import * as api from '@opentelemetry/api';
import { ENV_CONFIG } from '@root/platform/env-config.service';
import { ApplicationInsightsSampler, AzureMonitorExporterOptions, AzureMonitorLogExporter, AzureMonitorMetricExporter, AzureMonitorTraceExporter } from "@azure/monitor-opentelemetry-exporter";
import { BatchSpanProcessor, ConsoleSpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { ConsoleMetricExporter, MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchLogRecordProcessor, ConsoleLogRecordExporter, LoggerProvider, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { NodeSDK, NodeSDKConfiguration, metrics } from "@opentelemetry/sdk-node";

import { THROW } from '@common/errors/do-error';
import { logs } from '@opentelemetry/api-logs';


const azureMonitorOptions: AzureMonitorExporterOptions = {
  connectionString: ENV_CONFIG.appInsightsConnectionString,
  disableOfflineStorage: false,
  storageDirectory: './azure-monitor-logs/',
};

const contextManager = new AsyncLocalStorageContextManager();
contextManager.enable();

const resource = new Resource({
  [ATTR_SERVICE_NAME]: ENV_CONFIG.openTelemetry.serviceName,
  [ATTR_SERVICE_VERSION]: ENV_CONFIG.openTelemetry.serviceVersion,
  // TODO: Figure out what this INSTANCE_ID field is supposed to be now
  [SEMRESATTRS_SERVICE_INSTANCE_ID]: ENV_CONFIG.openTelemetry.ServiceInstanceId,
});

// TODO: Common setup?
const sdkConfig: Partial<NodeSDKConfiguration> = {
  resource: resource,
  contextManager,
  spanProcessors: [
    new BatchSpanProcessor(new AzureMonitorTraceExporter(azureMonitorOptions), { exportTimeoutMillis: 15000, maxExportBatchSize: 1000, }),
    new SimpleSpanProcessor(new ConsoleSpanExporter()),
  ],
  metricReader:  new PeriodicExportingMetricReader({ exporter: new AzureMonitorMetricExporter(azureMonitorOptions)}),
  logRecordProcessors: [
    new BatchLogRecordProcessor(new AzureMonitorLogExporter(azureMonitorOptions)),
    new SimpleLogRecordProcessor(new ConsoleLogRecordExporter()),
  ],
  instrumentations: [],
};
const sdk = new NodeSDK(sdkConfig);
sdk.start();

// TODO: Common setup?
// const contextManager = new AsyncLocalStorageContextManager();
// contextManager.enable();
// api.context.setGlobalContextManager(contextManager);

// // // wiring up azure monitor
// // const options: AzureMonitorOpenTelemetryOptions = {
// //   azureMonitorExporterOptions: {
// //     connectionString: ENV_CONFIG.appInsightsConnectionString,
// //     disableOfflineStorage: false,
// //     storageDirectory: './azure-monitor-logs/'
// //   },
// //   enableLiveMetrics: true,
// //   enableStandardMetrics: true,
// //   enableTraceBasedSamplingForLogs: false,
// //   resource: resource,
// // };
// // useAzureMonitor(options);

// traces
// const aiTracer = new NodeTracerProvider({
//   resource,
//   sampler: new ApplicationInsightsSampler(0),
//   spanProcessors: [
//     new BatchSpanProcessor(new AzureMonitorTraceExporter(azureMonitorOptions), { exportTimeoutMillis: 15000, maxExportBatchSize: 1000, }),
//   ]
// });
// aiTracer.register({ contextManager });


/** Telemetry Context fields. */
export const CTX = {
  GUILD: api.createContextKey('djs-guild'),
  CHANNEL: api.createContextKey('djs-channel'),
  MESSAGE: api.createContextKey('djs-message'),
  AUTHOR: api.createContextKey('djs-author'),
  SHARD: api.createContextKey('djs-shard'),
  SHARDSET: api.createContextKey('djs-shardset'),
  EVENT: api.createContextKey('djs-event'),
}

// bro what https://github.com/open-telemetry/opentelemetry-js/blob/main/doc/esm-support.md
export class TelemetryService {
  // public readonly sdk = sdk;
  // public readonly contextManager = contextManager;
}