import { Injectable } from "injection-js";

export type BotStats<TKeys extends string> = Record<TKeys, string | undefined>;

@Injectable()
export abstract class BehaviorStatsBase {
  public abstract getStats(): Promise<BotStats<string>>;
}