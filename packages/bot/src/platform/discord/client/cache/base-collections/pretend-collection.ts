
import { GLOBAL_STATE } from "@root/platform/discord/global-app-state";
import { Collection, LimitedCollection, LimitedCollectionOptions, ReadonlyCollection } from "discord.js";
import { defaults, initial } from "lodash";

const pretendCaches: Record<string, PretendCollection<any, any>> = {};

interface CollectionConstructor {
    new (): Collection<unknown, unknown>;
    new <K, V>(entries?: readonly (readonly [K, V])[] | null): Collection<K, V>;
    new <K, V>(iterable: Iterable<readonly [K, V]>): Collection<K, V>;
    readonly prototype: Collection<unknown, unknown>;
    readonly [Symbol.species]: CollectionConstructor;
}

/** A "Collection" which stores nothing. */
export class PretendCollection<Key= any, Value= any> implements Collection<Key, Value> {
  public static makeOne(label: string) {
    return pretendCaches[label] ??= new PretendCollection(label);
  }
  constructor(public readonly label: string) {
  }

  ["constructor"]: CollectionConstructor = ((label, ...idk: any[]) => PretendCollection.makeOne(label)) as any;

  ensure(key: Key, defaultValueGenerator: (key: Key, collection: this) => Value): Value {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return defaultValueGenerator(key, this);
  }
  hasAll(...keys: Key[]): boolean {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return false;
  }
  hasAny(...keys: Key[]): boolean {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return false;
  }
  first(): Value | undefined;
  first(amount: number): Value[];
  first(amount?: unknown): Value | Value[] | undefined {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return undefined;
  }
  firstKey(): Key | undefined;
  firstKey(amount: number): Key[];
  firstKey(amount?: unknown): Key | Key[] | undefined {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return undefined;
  }
  last(): Value | undefined;
  last(amount: number): Value[];
  last(amount?: unknown): Value | Value[] | undefined {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return undefined;
  }
  lastKey(): Key | undefined;
  lastKey(amount: number): Key[];
  lastKey(amount?: unknown): Key | Key[] | undefined {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return undefined;
  }
  at(index: number): Value | undefined {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return undefined;
  }
  keyAt(index: number): Key | undefined {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return undefined;
  }
  random(): Value | undefined;
  random(amount: number): Value[];
  random(amount?: unknown): Value | Value[] | undefined {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return undefined;
  }
  randomKey(): Key | undefined;
  randomKey(amount: number): Key[];
  randomKey(amount?: unknown): Key | Key[] | undefined {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return undefined;
  }
  reverse(): this {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return this;
  }
  find<V2 extends Value>(fn: (value: Value, key: Key, collection: this) => value is V2): V2 | undefined;
  find(fn: (value: Value, key: Key, collection: this) => unknown): Value | undefined;
  find<This, V2 extends Value>(fn: (this: This, value: Value, key: Key, collection: this) => value is V2, thisArg: This): V2 | undefined;
  find<This>(fn: (this: This, value: Value, key: Key, collection: this) => unknown, thisArg: This): Value | undefined;
  find(fn: unknown, thisArg?: unknown): Value | undefined {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return undefined;
  }
  findKey<K2 extends Key>(fn: (value: Value, key: Key, collection: this) => key is K2): K2 | undefined;
  findKey(fn: (value: Value, key: Key, collection: this) => unknown): Key | undefined;
  findKey<This, K2 extends Key>(fn: (this: This, value: Value, key: Key, collection: this) => key is K2, thisArg: This): K2 | undefined;
  findKey<This>(fn: (this: This, value: Value, key: Key, collection: this) => unknown, thisArg: This): Key | undefined;
  findKey(fn: unknown, thisArg?: unknown): Key | undefined {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return undefined;
  }
  sweep(fn: (value: Value, key: Key, collection: this) => unknown): number;
  sweep<T>(fn: (this: T, value: Value, key: Key, collection: this) => unknown, thisArg: T): number;
  sweep(fn: unknown, thisArg?: unknown): number {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return 0;
  }
  filter<K2 extends Key>(fn: (value: Value, key: Key, collection: this) => key is K2): Collection<K2, Value>;
  filter<V2 extends Value>(fn: (value: Value, key: Key, collection: this) => value is V2): Collection<Key, V2>;
  filter(fn: (value: Value, key: Key, collection: this) => unknown): Collection<Key, Value>;
  filter<This, K2 extends Key>(fn: (this: This, value: Value, key: Key, collection: this) => key is K2, thisArg: This): Collection<K2, Value>;
  filter<This, V2 extends Value>(fn: (this: This, value: Value, key: Key, collection: this) => value is V2, thisArg: This): Collection<Key, V2>;
  filter<This>(fn: (this: This, value: Value, key: Key, collection: this) => unknown, thisArg: This): Collection<Key, Value>;
  filter(fn: unknown, thisArg?: unknown): Collection<Key, Value> {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return this;
  }
  partition<K2 extends Key>(fn: (value: Value, key: Key, collection: this) => key is K2): [Collection<K2, Value>, Collection<Exclude<Key, K2>, Value>];
  partition<V2 extends Value>(fn: (value: Value, key: Key, collection: this) => value is V2): [Collection<Key, V2>, Collection<Key, Exclude<Value, V2>>];
  partition(fn: (value: Value, key: Key, collection: this) => unknown): [Collection<Key, Value>, Collection<Key, Value>];
  partition<This, K2 extends Key>(fn: (this: This, value: Value, key: Key, collection: this) => key is K2, thisArg: This): [Collection<K2, Value>, Collection<Exclude<Key, K2>, Value>];
  partition<This, V2 extends Value>(fn: (this: This, value: Value, key: Key, collection: this) => value is V2, thisArg: This): [Collection<Key, V2>, Collection<Key, Exclude<Value, V2>>];
  partition<This>(fn: (this: This, value: Value, key: Key, collection: this) => unknown, thisArg: This): [Collection<Key, Value>, Collection<Key, Value>];
  partition(fn: unknown, thisArg?: unknown): [any, any] {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return [this, this];
  }
  flatMap<T>(fn: (value: Value, key: Key, collection: this) => Collection<Key, T>): Collection<Key, T>;
  flatMap<T, This>(fn: (this: This, value: Value, key: Key, collection: this) => Collection<Key, T>, thisArg: This): Collection<Key, T>;
  flatMap(fn: unknown, thisArg?: unknown): Collection<Key, any> | Collection<Key, any> {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return this;
  }
  map<T>(fn: (value: Value, key: Key, collection: this) => T): T[];
  map<This, T>(fn: (this: This, value: Value, key: Key, collection: this) => T, thisArg: This): T[];
  map(fn: unknown, thisArg?: unknown): any[] {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return [];
  }
  mapValues<T>(fn: (value: Value, key: Key, collection: this) => T): Collection<Key, T>;
  mapValues<This, T>(fn: (this: This, value: Value, key: Key, collection: this) => T, thisArg: This): Collection<Key, T>;
  mapValues(fn: unknown, thisArg?: unknown): Collection<Key, any> | Collection<Key, any> {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return this;
  }
  some(fn: (value: Value, key: Key, collection: this) => unknown): boolean;
  some<T>(fn: (this: T, value: Value, key: Key, collection: this) => unknown, thisArg: T): boolean;
  some(fn: unknown, thisArg?: unknown): boolean {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return false;
  }
  every<K2 extends Key>(fn: (value: Value, key: Key, collection: this) => key is K2): this is Collection<K2, Value>;
  every<V2 extends Value>(fn: (value: Value, key: Key, collection: this) => value is V2): this is Collection<Key, V2>;
  every(fn: (value: Value, key: Key, collection: this) => unknown): boolean;
  every<This, K2 extends Key>(fn: (this: This, value: Value, key: Key, collection: this) => key is K2, thisArg: This): this is Collection<K2, Value>;
  every<This, V2 extends Value>(fn: (this: This, value: Value, key: Key, collection: this) => value is V2, thisArg: This): this is Collection<Key, V2>;
  every<This>(fn: (this: This, value: Value, key: Key, collection: this) => unknown, thisArg: This): boolean;
  every(fn: unknown, thisArg?: unknown): boolean {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return false;
  }
  reduce<T = Value>(fn: (accumulator: T, value: Value, key: Key, collection: this) => T, initialValue?: T | undefined): T {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return initialValue!;
  }
  each(fn: (value: Value, key: Key, collection: this) => void): this;
  each<T>(fn: (this: T, value: Value, key: Key, collection: this) => void, thisArg: T): this;
  each(fn: unknown, thisArg?: unknown): this {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return this;
  }
  tap(fn: (collection: this) => void): this;
  tap<T>(fn: (this: T, collection: this) => void, thisArg: T): this;
  tap(fn: unknown, thisArg?: unknown): this {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return this;
  }
  clone(): Collection<Key, Value> {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return this;
  }
  concat(...collections: ReadonlyCollection<Key, Value>[]): Collection<Key, Value> {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return this;
  }
  equals(collection: ReadonlyCollection<Key, Value>): boolean {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return false;
  }
  sort(compareFunction?: any | undefined): this {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return this;
  }
  intersect<T>(other: ReadonlyCollection<Key, T>): Collection<Key, T> {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return this as any as Collection<Key, T>;
  }
  subtract<T>(other: ReadonlyCollection<Key, T>): Collection<Key, Value> {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return this;
  }
  difference<T>(other: ReadonlyCollection<Key, T>): Collection<Key, Value | T> {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return this;
  }
  merge<T, R>(other: ReadonlyCollection<Key, T>, whenInSelf: (value: Value, key: Key) => any, whenInOther: (valueOther: T, key: Key) => any, whenInBoth: (value: Value, valueOther: T, key: Key) => any): Collection<Key, R> {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return this as unknown as Collection<Key, R>;
  }
  sorted(compareFunction?: any): Collection<Key, Value> {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return this;
  }
  toJSON(): Value[] {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return [];
  }
  clear(): void {
  }
  delete(key: Key): boolean {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return false;
  }
  forEach(callbackfn: (value: Value, key: Key, map: Map<Key, Value>) => void, thisArg?: any): void {
  }
  get(key: Key): Value | undefined {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return undefined;
  }
  has(key: Key): boolean {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return false;
  }
  set(key: Key, value: Value): this {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return this;
  }
  size: number = 0;
  entries(): IterableIterator<[Key, Value]> {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return [].entries() as any as IterableIterator<[Key, Value]>;
  }
  keys(): IterableIterator<Key> {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return [].entries() as any as IterableIterator<Key>;
  }
  values(): IterableIterator<Value> {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return [].entries() as any as IterableIterator<Value>;
  }
  [Symbol.iterator](): IterableIterator<[Key, Value]> {
    // GLOBAL_STATE.isAfterClientReady && console.log(`[${this.label}]`);
    return [].entries() as any as IterableIterator<[Key, Value]>;
  }
  [Symbol.toStringTag]: string = "haha lol";
}