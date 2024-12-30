import { THROW } from "@common/errors/do-error";
import { OTel } from "@common/services/logger.service/open-telemetry/config";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";

export const contextManager = new AsyncLocalStorageContextManager();
contextManager.enable();
OTel.api.context.setGlobalContextManager(contextManager) || THROW(new Error("Unable to set global context manager"));