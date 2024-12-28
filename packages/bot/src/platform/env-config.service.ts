import { RollemConfigError } from "@common/errors";
import { THROW } from "@common/errors/do-error";
import { RollemInitializerError } from "@common/errors/initializer-error";
import { IInitializeable, RollemProvider } from "@common/util/injector-wrapper";
import { Snowflake } from "discord.js";
import { Injectable, Provider } from "injection-js";
import { string, z } from "zod";

function OptionalBoolSchema(name: string) {
  return z
    .string().optional().transform(v => v?.toLowerCase())
    .pipe(
      z.enum(['true', 'false'], { invalid_type_error: `If provided, ${name} must be true or false`})
      .optional()
      .transform(v => v === 'true'))
    .pipe(z.boolean().default(false));
}

const discordSnowflake = z.custom<Snowflake>((val) => {
  return typeof val === "string" ? /^\d+px$/.test(val) : false;
});

const EnvSchema = z.object({
  DISCORD_BOT_SHARD_ID: z.literal(undefined, { message: 'DISCORD_BOT_SHARD_ID should no longer be provided' }),

  DISCORD_BOT_SHARDSET_ID: z.coerce
    .number({ invalid_type_error: 'DISCORD_BOT_SHARDSET_ID must be a non-negative integer' })
    .min(0, 'DISCORD_BOT_SHARDSET_ID must be a positive integer'),
  DISCORD_BOT_SHARDSET_COUNT: z.coerce
    .number({ invalid_type_error: 'DISCORD_BOT_SHARDSET_COUNT must be a positive integer' })
    .min(1, 'DISCORD_BOT_SHARDSET_COUNT must be a positive integer'),
  DISCORD_BOT_SHARDSET_SHARDS_PER_SET: z.coerce
    .number({ invalid_type_error: 'DISCORD_BOT_SHARDSET_SHARDS_PER_SET must be a positive integer' })
    .min(1, 'DISCORD_BOT_SHARDSET_SHARDS_PER_SET must be a positive integer'),

  DISCORD_BOT_USER_TOKEN: z.string({ required_error: 'DISCORD_BOT_USER_TOKEN missing'}),

  ROLLEM_LOCAL_DIAGNOSTIC_MODE: OptionalBoolSchema("ROLLEM_LOCAL_DIAGNOSTIC_MODE"),
  DEFER_TO_CLIENT_IDS: z.string().optional().transform(v => v?.split(',').map(v => v.trim()))
    .pipe(z.array(discordSnowflake, { invalid_type_error: 'DEFER_TO_CLIENT_IDS must be a comma separated array of (Bot) User IDs'}))
    .optional(),
  APPINSIGHTS_CONNECTIONSTRING: z.string().optional(),
  DB_CONNECTION_STRING: z.string().optional(),
  DB_DISABLE_SSL: OptionalBoolSchema("DB_DISABLE_SSL"),

  // required for open telemetry
  OPENTELEMETRY_ATTR_SERVICE_NAME:
    z.string({ required_error: "OPENTELEMETRY_ATTR_SERVICE_NAME is required by OpenTelemetry, but was not provided"}),
  OPENTELEMETRY_ATTR_SERVICE_VERSION:
    z.string({ required_error: "OPENTELEMETRY_ATTR_SERVICE_VERSION is required by OpenTelemetry, but was not provided"})
  
  
  // // required for UI
  // DISCORD_CLIENT_ID,
  // DISCORD_CLIENT_SECRET,
  // DISCORD_REDIRECT_URI,

  // // required for mastodon
  // MASTODON_URI,
  // MASTODON_ACCESS_TOKEN,
})

/** Configuration relating to the execution environment. */
@Injectable()
export class EnvConfig implements IInitializeable {
  /** The only instance. */
  public static readonly instance = new EnvConfig();

  /** Providers for this class. */
  public static readonly providers: RollemProvider[] = [
    { provide: EnvConfig, useValue: EnvConfig.instance },
  ]
  
  private constructor() {}

  /** The environment variables. */
  public readonly env = EnvSchema.parse(process.env);

  /** Gets the App Insights Connection String. */
  public get appInsightsConnectionString() {
    return this.env.APPINSIGHTS_CONNECTIONSTRING;
  }

  /** Secret values. */
  public get secrets() {
    return {
      discordToken: this.env.DISCORD_BOT_USER_TOKEN,
      appInsightsConnectionString: this.env.APPINSIGHTS_CONNECTIONSTRING,
    }
  }

  /** Dev-related behavior settings. */
  public get behaviorConfig() {
    return {
      /** When these users are present and online, no replies should be sent. */
      deferToBotClientIds: this.env.DEFER_TO_CLIENT_IDS,
      /** When true, no replies should be sent. */
      diagnosticMode: this.env.ROLLEM_LOCAL_DIAGNOSTIC_MODE,
    };
  }

  /** Information about this shard-set's launch context. */
  public get shardSetInfo() {
    return {
      index: this.env.DISCORD_BOT_SHARDSET_ID,
      setCount: this.env.DISCORD_BOT_SHARDSET_COUNT,
      shardsPerSet: this.env.DISCORD_BOT_SHARDSET_SHARDS_PER_SET,
      totalShards: this.env.DISCORD_BOT_SHARDSET_COUNT * this.env.DISCORD_BOT_SHARDSET_SHARDS_PER_SET,
      name: (
        (this.env.DISCORD_BOT_SHARDSET_ID+1 === 1)
        && (this.env.DISCORD_BOT_SHARDSET_COUNT === 1)
        && (this.env.DISCORD_BOT_SHARDSET_SHARDS_PER_SET === 1)
      ) ? 'only' : `${this.env.DISCORD_BOT_SHARDSET_ID+1}-of-${this.env.DISCORD_BOT_SHARDSET_COUNT} (x${this.env.DISCORD_BOT_SHARDSET_SHARDS_PER_SET})`
    }
  }

  /** Fields used for configuring  OpenTelemetry */
  public get openTelemetry() {
    return {
      serviceName: this.env.OPENTELEMETRY_ATTR_SERVICE_NAME,
      serviceVersion: this.env.OPENTELEMETRY_ATTR_SERVICE_VERSION,
      ServiceInstanceId: `${this.shardSetInfo.name}`,
    };
  }

  public async initialize(): Promise<void> {
    // this._env = await EnvSchema.parseAsync(process.env);
  }
}

/** Static reference to env-config. */
export const ENV_CONFIG = EnvConfig.instance;