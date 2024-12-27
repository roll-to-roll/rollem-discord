// enable application insights if we have an instrumentation key set up
import * as appInsights from "applicationinsights";
import { Client, Message } from "discord.js";
import { OriginalConfig } from "../../../platform/original-config.service";
import util from "util";
import { Injectable } from "injection-js";

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
  private readonly aiClient?: appInsights.TelemetryClient;

  constructor(
    /** The associated config. */
    public config: OriginalConfig,
  ) {
    if (config.AppInsightsConnectionString) {
      try {
        console.log("Configuring Application Insights");
        // TODO: This reads all log messages from console. We can probably do better by logging via winston/bunyan.
        appInsights.setup(config.AppInsightsConnectionString)
          .setAutoDependencyCorrelation(true)
          .setAutoCollectRequests(true)
          .setAutoCollectPerformance(true)
          .setAutoCollectExceptions(true)
          .setAutoCollectDependencies(false)
          .setAutoCollectConsole(true, true)
          .setUseDiskRetryCaching(true)
          .start();
      } catch (ex) {
        try {
          console.log(`Application Insights failed to connect. ${config.AppInsightsConnectionString}`, ex);
          return;
        } catch {
          console.log(`Application Insights failed to connect. (2) ${config.AppInsightsConnectionString}`);
          return;
        }
      }
    }

    // Will be `undefined` unless appInsights successfully initialized.
    this.aiClient = appInsights.defaultClient;

    // this.aiClient.addTelemetryProcessor((envelope, context) => {
    //   envelope.data.
    //   return true;
    // });
  }

  /** Tracks an event with AI using a console fallback. */
  // TODO: Convert many of the operations to use trackRequest instead. See https://docs.microsoft.com/en-us/azure/application-insights/app-insights-api-custom-events-metrics#trackrequest
  public trackSimpleEvent(category: LoggerCategory, name: string, properties = {}) {
    if (ignoredCategories.includes(category)) { return; }

    if (this.aiClient) {
      console.log(name, properties);
      this.aiClient.trackEvent({
        name: name,
        measurements: this.enrichAIMetrics(null),
        properties: this.enrichAIProperties(null, properties)
      });
    } else {
      console.log(name, properties);
    }
  }

  /** Tracks an event with AI using a console fallback. */
  // TODO: Convert many of the operations to use trackRequest instead. See https://docs.microsoft.com/en-us/azure/application-insights/app-insights-api-custom-events-metrics#trackrequest
  public trackMessageEvent(category: LoggerCategory, name: string, message: Message, properties = {}) {
    if (ignoredCategories.includes(category)) { return; }
    
    if (this.aiClient) {
      console.log(name, /*message,*/ properties);
      this.aiClient.trackEvent({
        name: name,
        measurements: this.enrichAIMetrics(message),
        properties: this.enrichAIProperties(message, properties)
      });
    } else {
      console.log(name, /*message,*/ properties);
    }
  }

  /** Tracks a metric with AI using a console fallback. */
  public trackMetric(category: LoggerCategory, name: string, value: number) {
    if (ignoredCategories.includes(category)) { return; }
    
    if (this.aiClient) {
      this.aiClient.trackMetric({
        name: name,
        value: value
      });
    } else {
      // oblivion
    }
  }

  /** Tracks an error with AI using a console fallback. */
  public trackMessageError(category: LoggerCategory, name: string, message: Message, error?: Error) {
    if (ignoredCategories.includes(category)) { return; }
    
    if (this.aiClient) {
      console.error(name, /*message,*/ util.inspect(error));
      error = error || new Error(name);
      this.aiClient.trackException({
        exception: error,
        properties: {
          error: util.inspect(error),
          "Message ID": '' + (message?.id ?? ''),
          label: name,
        }
      })
    } else {
      console.error(name, /*message,*/ util.inspect(error));
    }
  }

  /** Tracks an error with AI using a console fallback. */
  public trackError(category: LoggerCategory, name: string, error?: Error) {
    if (ignoredCategories.includes(category)) { return; }
    
    if (this.aiClient) {
      console.error(name, util.inspect(error));
      error = error || new Error(name);
      this.aiClient.trackException({
        exception: error,
        properties: {
          error: util.inspect(error),
          label: name,
        }
      })
    } else {
      console.error(name, util.inspect(error));
    }
  }

  /** Flushes the logger's pending messages. */
  public flush(): any {
    if (this.aiClient) { this.aiClient.flush(); }
  }

  /** Constructs a borg-readable string identifying this shard. Like "7 of 9" */
  public shardName() {
    var shardId = this.shardId();
    var shardCount = this.shardCount();
    
    if (typeof shardCount == "undefined") { return undefined; }
    if (shardCount > 1) { return `${shardId} of ${shardCount}`; }

    return "only";
  }

  /** Constructs a one-index string identifying this shard. */
  public shardId() {
    if (this.config.HasShardInfo && typeof this.config.ShardId == "number") {
      return this.config.ShardId + 1;
    }

    return 1;
  }

  /** Safely retrieves the shard count. */
  public shardCount() {
    if (this.config.HasShardInfo) {
      return this.config.ShardCount;
    }
    
    return 1;
  }

  /** Adds common AI properties to the given object (or creates one). Returns the given object. */
  private enrichAIProperties(message: Message|null, object = {}) {
    // if (this.client && this.client.user) {
      object['Guild ID'] = '' + (message?.guildId ?? 'none');
      object['Author ID'] = '' + (message?.author?.id ?? 'none');
      object['Channel ID'] = '' + (message?.channelId ?? 'none');
      object["Message ID"] = '' + (message?.id ?? '');
      object["Shard Name"] = '' + this.shardName();
      // object["Client ID"] = '' + this.client.user.id;
      // object["Client Name"] = '' + this.client.user.username;
    // }
    
    // if (this.changelog) {
    //   object["Version"] = '' + this.changelog.version;
    // }

    return object;
  }

  /** Adds common AI metrics to the given object (or creates one). Returns the given object. */
  private enrichAIMetrics(message: Message|null, object = {}) {
    // if (this.client) {
    //   object['Servers (per shard)'] = this.client.guilds.cache.size;
    //   object['Users (per shard)'] = this.client.users.cache.size;
    //   object['Uptime (minutes)'] = (this.client.uptime || 0) / 1000 / 60;
      object['Shard Count'] = this.shardCount();
      object['Shard ID'] = this.shardId();
    // }

    return object;
  }
}