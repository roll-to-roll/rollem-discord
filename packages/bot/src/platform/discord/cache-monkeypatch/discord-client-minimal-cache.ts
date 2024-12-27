import { LimitedCollection, LimitedCollectionOptions } from "discord.js";
import { defaults } from "lodash";

export class MinimalLimitedCache<Key, Value> extends LimitedCollection<Key, Value> {
  constructor(public keyType: any, public holdsType: any, options: LimitedCollectionOptions<Key, Value>, iterable?: Iterable<readonly [Key, Value]>) {
    super(options, iterable);
    console.debug(this.keyType, '->', this.holdsType, 'up to', this.size);
  }

  public set(key: Key, value: Value): this {
    console.debug(this.keyType.constructor.name, '->', this.holdsType.constructor.name, 'up to', this.size);
    return super.set(key, value);
  }
}