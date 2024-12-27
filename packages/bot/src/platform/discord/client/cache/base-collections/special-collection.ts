import { Newable } from "@common/util/types/utility-types";
import { GLOBAL_STATE } from "@root/platform/discord/global-app-state";
import { Collection } from "discord.js";

export interface KeepMapFunction<Value> {
  storeFn: (v: Value) => Partial<Value>,
  keepFn?: (v: Value) => boolean,
}

/** A customized {@link Collection} which only stores values as determined by {@link config} */
export class SpecialCollection<Key, Value> extends Collection<Key, Value> {
  constructor(
    public keyType: Key & Newable<any>,
    public holdsType: Value & Newable<Value>,
    public config?: KeepMapFunction<Value>,
    iterable?: Iterable<readonly [Key, Value]>
  ) {
    super(iterable);
    GLOBAL_STATE.isAfterClientReady && console.debug('create', this.whatAreMyKeys, '->', this.whatDoIHold, 'up to', this.size);
  }

  public get whatDoIHold(): Value & Newable<any> { return this.holdsType ?? this.first()?.constructor; }
  public get whatAreMyKeys(): Key & Newable<any> { return this.keyType ?? this.firstKey()?.constructor; }

  public set(key: Key, value: Value): this {
    const shouldKeep = this.config?.keepFn?.(value) ?? true;
    if (!shouldKeep) return this;
    const keepPart = this.config?.storeFn?.(value) ?? value;
    const res = super.set(key, keepPart as Value);
    GLOBAL_STATE.isAfterClientReady && console.debug('set', key, '->', value?.constructor, 'up to', this.size);
    return res;
  }
}
