import { CachedManager } from "discord.js";


export type ManagerKey<TManager> = TManager extends CachedManager<infer Key, infer Holds, infer Resolvable> ? Key : never;
export type ManagerHolds<TManager> = TManager extends CachedManager<infer Key, infer Holds, infer Resolvable> ? Holds : never;
export type ManagerResolveable<TManager> = TManager extends CachedManager<infer Key, infer Holds, infer Resolvable> ? Resolvable : never;