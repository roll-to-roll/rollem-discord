import { OTel_Processor_Bundle, OTel_Processor_Source } from "@common/services/logger.service/open-telemetry/processor.base";
import { OTel_Processor_RollemContext_CopyToSpan } from "@common/services/logger.service/open-telemetry/processors/initializers/rollem/copy-to-span.processor";
import { OTel_Processor_RollemContext_DiscardRules } from "@common/services/logger.service/open-telemetry/processors/initializers/rollem/discard-rules.processor";
export * from "./context.interface";
export * from "./context";

/** Generates unified config for AzureMonitor. */
export class OTel_Initializer_Baggage extends OTel_Processor_Source<typeof OTel_Initializer_Baggage> {
  /** Generates new exporters based on current settings. */
  public makeExporters(): OTel_Processor_Bundle {
    return {
      metrics: [],
      tracer: [
        new OTel_Processor_RollemContext_DiscardRules(),
        new OTel_Processor_RollemContext_CopyToSpan(),
      ],
      logs: [],
    };
  };
}