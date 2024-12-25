import { ParserVersion } from '@common/standard-behaviors/types/behavior-context';
import { Injectable } from 'injection-js';
import * as client from 'prom-client';
import { ChangeLog } from '../platform/discord/rollem-bot/changelog';
import { Config } from '../platform/discord/rollem-bot/config';

export enum HandlerType {
  Roll = 'roll',
  Changelog = 'changelog',
  PingPong = 'ping-pong',
  Stats = 'stats',
  Storage = 'storage'
}

export enum RollHandlerSubtype {
  Bracketed = 'bracketed',
  ShortPrefixed = 'short-prefixed',
  SoftParse = 'soft-parse',
  Tagged = 'tagged',
}


export enum ParserRollType {
  Many = 'many',
  Fortune = 'fortune',
  Grouped = 'grouped',
  ManyInBulk = 'many-in-bulk',
  Spoilered = "spoilered"
}

export enum StorageHandlerSubtype {
  Dump = 'dump',
  Forget = 'forget',
  Default = 'default',
}

/** Manages logging to prometheus. */
@Injectable()
export class PromLogger {
  constructor(
    config: Config,
    changelog: ChangeLog,
  ) {
    const shardLabel = config.ShardLabel;
    const defaultLabels = { shard: shardLabel, version: changelog.version };
    client.collectDefaultMetrics({ labels: defaultLabels });
    client.register.setDefaultLabels(defaultLabels);
  }

  public readonly client = client;
  private readonly eventsProcessed = new client.Counter({
    name: 'rollem_events_processed',
    help: 'A counter for events that rollem has processed. May not include all events.',
    labelNames: ['activity', 'guild_id'],
  });
  private readonly parserUse = new client.Counter({
    name: 'rollem_parser_use',
    help: 'A counter for rollem parser usage.',
    labelNames: ['roll_type', 'roll_version'],
  });
  private readonly handlersUsed = new client.Counter({
    name: 'rollem_handlers_used',
    help: 'A counter for handlers that have been successfully triggered.',
    labelNames: ['handler_type', 'handler_subtype'],
  });

  public incHandlersUsed(handlerType: Exclude<Exclude<HandlerType, HandlerType.Roll>, HandlerType.Storage>);
  public incHandlersUsed(handlerType: HandlerType.Roll, handlerSubtype: RollHandlerSubtype);
  public incHandlersUsed(handlerType: HandlerType.Storage, handlerSubtype: StorageHandlerSubtype);
  public incHandlersUsed(handlerType: HandlerType, handlerSubtype?: RollHandlerSubtype | StorageHandlerSubtype) {
    this.handlersUsed.inc({
      'handler_type': handlerType,
      'handler_subtype': handlerSubtype,
    });
  }

  public incParserUse(rollType: ParserRollType, rollVersion: ParserVersion) {
    this.parserUse.inc({
      'roll_type': rollType,
      'roll_version': rollVersion,
    });
  }

  public incEventsProcessed(o: { activity: string, guildId?: string}) {
    this.eventsProcessed.inc({
      'activity': o.activity,
      'guild_id': o.guildId
    });
  }
}