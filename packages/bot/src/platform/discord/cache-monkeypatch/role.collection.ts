import { Newable } from "@common/util/types/utility-types";
import { GLOBAL_STATE } from "@root/platform/discord/global-state";
import { Collection, LimitedCollection, LimitedCollectionOptions, Role } from "discord.js";
import { pick } from "lodash";


export class SpecialLimitedCollection<Key, Value> extends LimitedCollection<Key, Value> {
  constructor(
    public keyType: Key & Newable<any>,
    public holdsType: Value & Newable<any>,
    options: LimitedCollectionOptions<Key, Value>,
    iterable?: Iterable<readonly [Key, Value]>
  ) {
    super(options, iterable);
    GLOBAL_STATE.isAfterStartup && console.debug('create', this.whatAreMyKeys, '->', this.whatDoIHold, 'up to', this.size);
  }

  public get whatDoIHold(): Value & Newable<any> { return this.holdsType ?? this.first()?.constructor; }
  public get whatAreMyKeys(): Key & Newable<any> { return this.keyType ?? this.firstKey()?.constructor; }

  public set(key: Key, value: Value): this {
    GLOBAL_STATE.isAfterStartup && console.debug('set', key, '->', value?.constructor, 'up to', this.size);
    return super.set(key, value);
  }
}
export class SpecialCollection<Key, Value> extends Collection<Key, Value> {
  constructor(
    public keyType: Key & Newable<any>,
    public holdsType: Value & Newable<any>,
    iterable?: Iterable<readonly [Key, Value]>
  ) {
    super(iterable);
    GLOBAL_STATE.isAfterStartup && console.debug('create', this.whatAreMyKeys, '->', this.whatDoIHold, 'up to', this.size);
  }

  public get whatDoIHold(): Value & Newable<any> { return this.holdsType ?? this.first()?.constructor; }
  public get whatAreMyKeys(): Key & Newable<any> { return this.keyType ?? this.firstKey()?.constructor; }

  public set(key: Key, value: Value): this {
    const res = super.set(key, value);
    GLOBAL_STATE.isAfterStartup && console.debug('set', key, '->', value?.constructor, 'up to', this.size);
    return res;
  }
}

export class RoleCollection<Key> extends SpecialCollection<Key, Role> {
  constructor(
    keyType: Key & Newable<any>,
    holdsType: Role & Newable<any>,
    options: LimitedCollectionOptions<Key, Role>,
    iterable?: Iterable<readonly [Key, Role]>
  ) {
    super(keyType, holdsType, iterable);
  }

  public set(key: Key, value: Role): this {
    // console.debug("Want to Set", key, "->", {
    //   role: {
    //     name: value?.name,
    //     id: value?.id,
    //   },
    //   guild: {
    //     name: value?.guild?.name,
    //     id: value?.guild?.id,
    //   },
    // });
    const isEveryone = value.name === '@everyone' || value.id === value?.guild?.id;
    const isRollemRole = value.name.startsWith('rollem:prefix:')
    if (!(isEveryone || isRollemRole)) return this;
    return super.set(key, pick(value, ['id', 'name']) as Role);
  }
}