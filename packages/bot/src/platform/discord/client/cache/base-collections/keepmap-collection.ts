import { ManagerKey, ManagerHolds } from "@root/platform/discord/client/cache/base-collections/types";
import { GLOBAL_STATE } from "@root/platform/discord/global-app-state";
import { Collection } from "discord.js";

export type KeepMapCollectionOptionsFromManager<TManager> = KeepMapCollectionOptions<ManagerKey<TManager>, ManagerHolds<TManager>>;

export interface KeepMapCollectionOptions<Key, Value> {
  mapFn?: (v: Value) => Partial<Value>,
  keepFn?: (value: Value, key: Key, collection: KeepMapCollection<Key, Value>) => boolean;
}

/** A customized {@link Collection} which only stores values as determined by {@link config} */
export abstract class KeepMapCollection<Key, Value> extends Collection<Key, Value> {
  constructor(
    iterable?: Iterable<readonly [Key, Value]> | readonly (readonly [Key, Value])[] | null | undefined
  ) {
    super(iterable);
    GLOBAL_STATE.isAfterClientReady && console.debug('create', this.constructor, 'up to', this.size);
  }

  public abstract get config(): KeepMapCollectionOptions<Key, Value>;

  public set(key: Key, value: Value): this {
    const shouldKeep = this.config?.keepFn?.(value, key, this) ?? true;
    if (!shouldKeep) return this;

    const keepPart = this.config?.mapFn?.(value) ?? value;
    const res = super.set(key, keepPart as Value);

    GLOBAL_STATE.isAfterClientReady && console.debug('set', this.constructor, '|', key, '->', value?.constructor, 'up to', this.size);

    return res;
  }

  /**
   * A hook to control clone operations.
   * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/species.
   */
  public static get [Symbol.species]() {
    return Collection;
  }
}
