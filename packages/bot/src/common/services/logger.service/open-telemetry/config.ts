import { Resource } from "@opentelemetry/resources";
import { ENV_CONFIG } from "@root/platform/env-config.service";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_SERVICE_INSTANCE_ID,
} from '@opentelemetry/semantic-conventions';
import { metrics, trace } from "@opentelemetry/api";
import { logs } from "@opentelemetry/api-logs";

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
  }
}
