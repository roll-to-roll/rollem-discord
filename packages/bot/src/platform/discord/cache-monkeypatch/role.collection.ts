import { Newable } from "@common/util/types/utility-types";
import { ObjectCollection } from "@root/platform/discord/cache-monkeypatch/obj.collection";
import { GLOBAL_STATE } from "@root/platform/discord/global-state";
import { Channel, Collection, Guild, GuildMember, LimitedCollection, LimitedCollectionOptions, Role } from "discord.js";
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

export interface KeepMapFunction<Value> {
  storeFn: (v: Value) => Partial<Value>,
  keepFn?: (v: Value) => boolean,
}
export class SpecialCollection<Key extends string | number | symbol, Value> extends Collection<Key, Value> {
  constructor(
    public keyType: Key & Newable<any>,
    public holdsType: Value & Newable<Value>,
    public config?: KeepMapFunction<Value>,
    iterable?: Iterable<readonly [Key, Value]>
  ) {
    super(iterable);
    GLOBAL_STATE.isAfterStartup && console.debug('create', this.whatAreMyKeys, '->', this.whatDoIHold, 'up to', this.size);
  }

  public get whatDoIHold(): Value & Newable<any> { return this.holdsType ?? this.first()?.constructor; }
  public get whatAreMyKeys(): Key & Newable<any> { return this.keyType ?? this.firstKey()?.constructor; }

  public set(key: Key, value: Value): this {
    const shouldKeep = this.config?.keepFn?.(value) ?? true;
    if (!shouldKeep) return this;
    const keepPart = this.config?.storeFn?.(value) ?? value;
    const res = super.set(key, keepPart as Value);
    GLOBAL_STATE.isAfterStartup && console.debug('set', key, '->', value?.constructor, 'up to', this.size);
    return res;
  }
}

export class RoleCollection<Key extends string | number | symbol> extends SpecialCollection<Key, Role> {
  static CONFIG: KeepMapFunction<Role> =  {
    keepFn: (value) => {
      const isEveryone = value.name === '@everyone' || value.id === value?.guild?.id;
      const isRollemRole = value.name.startsWith('rollem:prefix:')
      return (isEveryone || isRollemRole);
    },

    storeFn: (value) => pick(value, ['id', 'name']) as Role
  };

  constructor(
    keyType: Key & Newable<any>,
    holdsType: any,
    options?: LimitedCollectionOptions<Key, Role>,
    iterable?: Iterable<readonly [Key, Role]>
  ) {
    super(keyType, holdsType, RoleCollection.CONFIG, iterable);
  }
}

export class GuildCollection<Key extends string | number | symbol> extends SpecialCollection<Key, Guild> {
  static CONFIG: KeepMapFunction<Guild> =  {
    storeFn: (value) => pick(value, ['id', 'name']) as Partial<Guild>
  };

  constructor(
    keyType: Key & Newable<any>,
    holdsType: any,
    options?: LimitedCollectionOptions<Key, Guild>,
    iterable?: Iterable<readonly [Key, Guild]>
  ) {
    super(keyType, holdsType, GuildCollection.CONFIG, iterable);
  }
}

export class ChannelCollection<Key extends string | number | symbol> extends SpecialCollection<Key, Channel> {
  static CONFIG: KeepMapFunction<Channel> =  {
    storeFn: (value) => value,
    keepFn: (value) => {
      return value.isTextBased();
    }
  };

  constructor(
    keyType: Key & Newable<any>,
    holdsType: any,
    options?: LimitedCollectionOptions<Key, Channel>,
    iterable?: Iterable<readonly [Key, Channel]>
  ) {
    super(keyType, holdsType, ChannelCollection.CONFIG, iterable);
  }
}

export class GuildMemberCollection<Key extends string | number | symbol> extends SpecialCollection<Key, GuildMember> {
  static CONFIG: KeepMapFunction<GuildMember> =  {
    storeFn: (value) => value,
    keepFn: (value) => {
      return value.id == value.client.user.id;
    }
  };

  constructor(
    keyType: Key & Newable<any>,
    holdsType: any,
    options?: LimitedCollectionOptions<Key, GuildMember>,
    iterable?: Iterable<readonly [Key, GuildMember]>
  ) {
    super(keyType, holdsType, GuildMemberCollection.CONFIG, iterable);
  }
}