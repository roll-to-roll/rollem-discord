import { Client, Message } from "discord.js";
import { OriginalConfig } from "../../../platform/original-config.service";
import util from "util";
import { Injectable } from "injection-js";
import { ENV_CONFIG } from "@root/platform/env-config.service";

export enum LoggerCategory {
  SystemActivity,
  SystemEvent,
  BehaviorRegistration,
  BehaviorRouting,
  BehaviorEvent,
}

const ignoredCategories: LoggerCategory[] = []

/** Manages logging to application insights/console. */
@Injectable()
export class Logger {

  constructor(
    /** The associated config. */
    public config: OriginalConfig,
  ) {
    // if (config.AppInsightsConnectionString) {
    //   try {
    //     console.log("Configuring Application Insights");
    //     // TODO: This reads all log messages from console. We can probably do better by logging via winston/bunyan.
    //     appInsights.setup(config.AppInsightsConnectionString)
    //       .setAutoCollectConsole(false)
    //       .setAutoCollectDependencies(false)
    //       .setAutoCollectExceptions(false)
    //       .setAutoCollectHeartbeat(true)            // will likely be a useful metric
    //       .setAutoCollectIncomingRequestAzureFunctions(false)
    //       .setAutoCollectPerformance(true, false)   // will likely be a useful metric
    //       .setAutoCollectPreAggregatedMetrics(true) // reduces cost
    //       .setAutoCollectRequests(false)
    //       .enableWebInstrumentation(false)
    //       .setSendLiveMetrics(true)
    //       .start();
    //   } catch (ex) {
    //     try {
    //       console.log(`Application Insights failed to connect. ${config.AppInsightsConnectionString}`, ex);
    //       return;
    //     } catch {
    //       console.log(`Application Insights failed to connect. (2) ${config.AppInsightsConnectionString}`);
    //       return;
    //     }
    //   }
    // }

    // Will be `undefined` unless appInsights successfully initialized.
    // this.aiClient = appInsights.defaultClient;

    // this.aiClient.addTelemetryProcessor((envelope, context) => {
    //   envelope.data.
    //   return true;
    // });
  }

  /** Tracks an event with AI using a console fallback. */
  // TODO: Convert many of the operations to use trackRequest instead. See https://docs.microsoft.com/en-us/azure/application-insights/app-insights-api-custom-events-metrics#trackrequest
  public trackSimpleEvent(category: LoggerCategory, name: string, properties = {}) {
    if (ignoredCategories.includes(category)) { return; }

    // if (this.aiClient) {
    //   console.log(name, properties);
    //   this.aiClient.trackEvent({
    //     name: name,
    //     measurements: this.enrichAIMetrics(null),
    //     properties: this.enrichAIProperties(null, properties)
    //   });
    // } else {
      console.log(name, properties);
    // }
  }

  /** Tracks an event with AI using a console fallback. */
  // TODO: Convert many of the operations to use trackRequest instead. See https://docs.microsoft.com/en-us/azure/application-insights/app-insights-api-custom-events-metrics#trackrequest
  public trackMessageEvent(category: LoggerCategory, name: string, message: Message, properties = {}) {
    if (ignoredCategories.includes(category)) { return; }
    
    // if (this.aiClient) {
    //   console.log(name, /*message,*/ properties);
    //   this.aiClient.trackEvent({
    //     name: name,
    //     measurements: this.enrichAIMetrics(message),
    //     properties: this.enrichAIProperties(message, properties)
    //   });
    // } else {
      console.log(name, /*message,*/ properties);
    // }
  }

  /** Tracks a metric with AI using a console fallback. */
  public trackMetric(category: LoggerCategory, name: string, value: number) {
    if (ignoredCategories.includes(category)) { return; }
    
    // if (this.aiClient) {
    //   this.aiClient.trackMetric({
    //     name: name,
    //     value: value
    //   });
    // } else {
    //   // oblivion
    // }
  }

  /** Tracks an error with AI using a console fallback. */
  public trackMessageError(category: LoggerCategory, name: string, message: Message, error?: Error) {
    if (ignoredCategories.includes(category)) { return; }
    
    // if (this.aiClient) {
    //   console.error(name, /*message,*/ util.inspect(error));
    //   error = error || new Error(name);
    //   this.aiClient.trackException({
    //     exception: error,
    //     properties: {
    //       error: util.inspect(error),
    //       "Message ID": '' + (message?.id ?? ''),
    //       label: name,
    //     }
    //   })
    // } else {
      console.error(name, /*message,*/ util.inspect(error));
    // }
  }

  /** Tracks an error with AI using a console fallback. */
  public trackError(category: LoggerCategory, name: string, error?: Error) {
    if (ignoredCategories.includes(category)) { return; }
    
    // if (this.aiClient) {
    //   console.error(name, util.inspect(error));
    //   error = error || new Error(name);
    //   this.aiClient.trackException({
    //     exception: error,
    //     properties: {
    //       error: util.inspect(error),
    //       label: name,
    //     }
    //   })
    // } else {
      console.error(name, util.inspect(error));
    // }
  }

  /** Flushes the logger's pending messages. */
  public flush(): any {
    // if (this.aiClient) { this.aiClient.flush(); }
  }
}