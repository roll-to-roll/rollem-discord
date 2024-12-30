import { Newable } from "@common/util/types/utility-types";
import { GLOBAL_STATE } from "@root/platform/discord/global-app-state";
import { LimitedCollection, LimitedCollectionOptions } from "discord.js";



export class SpecialLimitedCollection<Key, Value> extends LimitedCollection<Key, Value> {
  constructor(
    public keyType: Key & Newable<any>,
    public holdsType: Value & Newable<any>,
    options: LimitedCollectionOptions<Key, Value>,
    iterable?: Iterable<readonly [Key, Value]>
  ) {
    super(options, iterable);
    GLOBAL_STATE.isAfterClientReady && console.debug('create', this.whatAreMyKeys, '->', this.whatDoIHold, 'up to', this.size);
  }

  public get whatDoIHold(): Value & Newable<any> { return this.holdsType ?? this.first()?.constructor; }
  public get whatAreMyKeys(): Key & Newable<any> { return this.keyType ?? this.firstKey()?.constructor; }

  public set(key: Key, value: Value): this {
    GLOBAL_STATE.isAfterClientReady && console.debug('set', key, '->', value?.constructor, 'up to', this.size);
    return super.set(key, value);
  }
}
