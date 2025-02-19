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
import { loggerProvider } from '@common/services/logger.service/open-telemetry/init.logger';
import { meterProvider } from '@common/services/logger.service/open-telemetry/init.metrics';
import { tracerProvider } from '@common/services/logger.service/open-telemetry/init.tracer';
import { OTel } from '@common/services/logger.service/open-telemetry/config';
import { contextManager } from '@common/services/logger.service/open-telemetry/init.context';
import { baggageUtils } from '@opentelemetry/core';
import { getActiveBaggage, getBaggage } from '@opentelemetry/api/build/src/baggage/context-helpers';
import { getActiveSpan } from '@opentelemetry/api/build/src/trace/context-utils';
import { RollemError } from '@common/errors';
import { clone, cloneDeep } from 'lodash';


// const azureMonitorOptions: AzureMonitorExporterOptions = {
//   connectionString: ENV_CONFIG.appInsightsConnectionString,
//   disableOfflineStorage: false,
//   storageDirectory: './azure-monitor-logs/',
// };

// const contextManager = new AsyncLocalStorageContextManager();
// contextManager.enable();

// // TODO: Common setup?
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

// // Add the exporter into the MetricReader and register it with the MeterProvider
// const exporter = new AzureMonitorMetricExporter({
//   connectionString:
//     process.env["APPLICATIONINSIGHTS_CONNECTION_STRING"] || "<your connection string>",
// });
// const metricReaderOptions = {
//   exporter: exporter,
// };
// const metricReader = new PeriodicExportingMetricReader(metricReaderOptions);
// const meterProvider = new MeterProvider();
// meterProvider.addMetricReader(metricReader);
// api.metrics.setGlobalMeterProvider(meterProvider);


/** Telemetry Context fields. */
export const CTX = {
  ROLLEM: api.createContextKey('djs-rollem'),

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
  public static loggerProvider = loggerProvider;
  public static meterProvider = meterProvider;
  public static traceProvider = tracerProvider;
  public static contextManager = contextManager;
  public static config = OTel;


}