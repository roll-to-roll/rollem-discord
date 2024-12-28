import { Logger, LoggerCategory } from "@common/services/logger.service/logger.service";
import { IInitializeable, RollemProvider } from "@common/util/injector-wrapper";
import { ENV_CONFIG, EnvConfig } from "@root/platform/env-config.service";
import { OriginalConfig } from "@root/platform/original-config.service";
import { Message } from "discord.js";
import { Injectable, Provider } from "injection-js";
import * as appInsights from 'applicationinsights';
import { TelemetryClient } from "applicationinsights";
import { RollemConfigError } from "@common/errors";


// we skip setup if the connection string is missing
if (!!ENV_CONFIG.appInsightsConnectionString) {
  appInsights.setup(ENV_CONFIG.appInsightsConnectionString)
    .setAutoCollectConsole(false)
    .setAutoCollectDependencies(false)
    .setAutoCollectExceptions(false)
    .setAutoCollectPerformance(true, false)   // will likely be a useful metric
    .setAutoCollectPreAggregatedMetrics(true) // reduces cost
    .setAutoCollectRequests(false)
    .enableWebInstrumentation(false)
    .setSendLiveMetrics(true)
    .start();
}

@Injectable()
export class AppInsightsService implements IInitializeable {
  /** Providers to inject into DI. */
  public static readonly providers: RollemProvider[] = [
    { provide: TelemetryClient, useValue: appInsights.defaultClient },
    AppInsightsService,
  ];

  constructor(
    public readonly client: TelemetryClient,
  ) { }

  public async initialize(): Promise<void> {
    // TODO: Wire up metrics / etc
  }
}