
import { Collection, ReadonlyCollection } from "discord.js";
import { entries, forEach, forOwn, has, keys, values } from "lodash";

/**
 * An experimental collection based on Object-style dict as a backing store.
 * I hoped it would reduce memory usage, but it didn't seem to.
 * Keeping it around for further testing.
 */
export class ObjectCollection<Key extends string | number | symbol, Value>
{
  protected backingObject: Record<Key, Value> = {} as Record<Key, Value>;

  constructor();


  constructor(entries?: readonly (readonly [Key, Value])[] | null);
  constructor(iterable?: Iterable<readonly [Key, Value]>);
  constructor(
    maybeEntries?:
      | readonly (readonly [Key, Value])[]
      | Iterable<readonly [Key, Value]>
      | null
  ) {}

  ["constructor"] = ObjectCollection;

  static get [Symbol.species]() {
    return ObjectCollection;
  }

  [Symbol.toStringTag] = "hi";

  public clear(): void { this.backingObject = {} as Record<Key, Value>; }
  /**
   * @returns true if an element in the Map existed and has been removed, or false if the element does not exist.
   */
  public delete(key: Key): boolean {
    const had = this.has(key);
    delete this.backingObject[key];
    return had;
  }
  /**
   * Executes a provided function once per each key/value pair in the Map, in insertion order.
   */
  forEach(callbackfn: (value: Value, key: Key, map: Map<Key, Value>) => void, thisArg?: any): void {
    forOwn(this.backingObject, (v, k, _) => callbackfn(v, k as Key, this as any as Map<Key, Value>));
  }
  /**
   * Returns a specified element from the Map object. If the value that is associated to the provided key is an object, then you will get a reference to that object and any change made to that object will effectively modify it inside the Map.
   * @returns Returns the element associated with the specified key. If no element is associated with the specified key, undefined is returned.
   */
  public get(key: Key): Value | undefined {
    return this.backingObject[key];
  }

  /**
   * @returns boolean indicating whether an element with the specified key exists or not.
   */
  public has(key: Key): boolean {
    return has(this.backingObject, key);
  }

  /**
   * Adds a new element with a specified key and value to the Map. If an element with the same key already exists, the element will be updated.
   */
  public set(key: Key, value: Value): this {
    this.backingObject[key] = value;
    return this;
  }

  /**
   * @returns the number of elements in the Map.
   */
  public get size(): number {
    return entries(this.backingObject).length;
  }

  /**
   * @returns the number of elements in the Map.
   */
  public entries() {
    return (entries(this.backingObject) as [Key, Value][]).values();
  }

  public values() {
    return (values(this.backingObject) as Value[]).values();
  }

  public keys() {
    return (keys(this.backingObject) as Key[]).values();
  }

  public [Symbol.iterator]() { return this.entries(); }



  /************************************************************************************** */
  intersect<T>(other: ReadonlyCollection<Key, T>): Collection<Key, T> {
    throw new Error("Method not implemented.");
  }
  subtract<T>(other: ReadonlyCollection<Key, T>): Collection<Key, Value> {
    throw new Error("Method not implemented.");
  }
  /************************************************************************************** */


  /**
   * Obtains the value of the given key if it exists, otherwise sets and returns the value provided by the default value generator.
   *
   * @param key - The key to get if it exists, or set otherwise
   * @param defaultValueGenerator - A function that generates the default value
   * @example
   * ```ts
   * collection.ensure(guildId, () => defaultGuildConfig);
   * ```
   */
  public ensure(
    key: Key,
    defaultValueGenerator: (key: Key, collection: this) => Value
  ): Value {
    if (this.has(key)) return this.get(key)!;
    if (typeof defaultValueGenerator !== "function")
      throw new TypeError(`${defaultValueGenerator} is not a function`);
    const defaultValue = defaultValueGenerator(key, this);
    this.set(key, defaultValue);
    return defaultValue;
  }

  /**
   * Checks if all of the elements exist in the collection.
   *
   * @param keys - The keys of the elements to check for
   * @returns `true` if all of the elements exist, `false` if at least one does not exist.
   */
  public hasAll(...keys: Key[]) {
    return keys.every((key) => this.has(key));
  }

  /**
   * Checks if any of the elements exist in the collection.
   *
   * @param keys - The keys of the elements to check for
   * @returns `true` if any of the elements exist, `false` if none exist.
   */
  public hasAny(...keys: Key[]) {
    return keys.some((key) => this.has(key));
  }

  /**
   * Obtains the first value(s) in this collection.
   *
   * @param amount - Amount of values to obtain from the beginning
   * @returns A single value if no amount is provided or an array of values, starting from the end if amount is negative
   */
  public first(): Value | undefined;
  public first(amount: number): Value[];
  public first(amount?: number): Value | Value[] | undefined {
    if (amount === undefined) return this.values().next().value;
    if (amount < 0) return this.last(amount * -1);
    if (amount >= this.size) return [...this.values()];

    const iter = this.values();
    // eslint-disable-next-line unicorn/no-new-array
    const results: Value[] = new Array(amount);
    for (let index = 0; index < amount; index++) {
      results[index] = iter.next().value!;
    }

    return results;
  }

  /**
   * Obtains the first key(s) in this collection.
   *
   * @param amount - Amount of keys to obtain from the beginning
   * @returns A single key if no amount is provided or an array of keys, starting from the end if
   * amount is negative
   */
  public firstKey(): Key | undefined;
  public firstKey(amount: number): Key[];
  public firstKey(amount?: number): Key | Key[] | undefined {
    if (amount === undefined) return this.keys().next().value;
    if (amount < 0) return this.lastKey(amount * -1);
    if (amount >= this.size) return [...this.keys()];

    const iter = this.keys();
    // eslint-disable-next-line unicorn/no-new-array
    const results: Key[] = new Array(amount);
    for (let index = 0; index < amount; index++) {
      results[index] = iter.next().value!;
    }

    return results;
  }

  /**
   * Obtains the last value(s) in this collection.
   *
   * @param amount - Amount of values to obtain from the end
   * @returns A single value if no amount is provided or an array of values, starting from the start if
   * amount is negative
   */
  public last(): Value | undefined;
  public last(amount: number): Value[];
  public last(amount?: number): Value | Value[] | undefined {
    if (amount === undefined) return this.at(-1);
    if (!amount) return [];
    if (amount < 0) return this.first(amount * -1);

    const arr = [...this.values()];
    return arr.slice(amount * -1);
  }

  /**
   * Obtains the last key(s) in this collection.
   *
   * @param amount - Amount of keys to obtain from the end
   * @returns A single key if no amount is provided or an array of keys, starting from the start if
   * amount is negative
   */
  public lastKey(): Key | undefined;
  public lastKey(amount: number): Key[];
  public lastKey(amount?: number): Key | Key[] | undefined {
    if (amount === undefined) return this.keyAt(-1);
    if (!amount) return [];
    if (amount < 0) return this.firstKey(amount * -1);

    const arr = [...this.keys()];
    return arr.slice(amount * -1);
  }

  /**
   * Identical to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at | Array.at()}.
   * Returns the item at a given index, allowing for positive and negative integers.
   * Negative integers count back from the last item in the collection.
   *
   * @param index - The index of the element to obtain
   */
  public at(index: number): Value | undefined {
    index = Math.trunc(index);
    if (index >= 0) {
      if (index >= this.size) return undefined;
    } else {
      index += this.size;
      if (index < 0) return undefined;
    }

    const iter = this.values();
    for (let skip = 0; skip < index; skip++) {
      iter.next();
    }

    return iter.next().value!;
  }

  /**
   * Identical to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at | Array.at()}.
   * Returns the key at a given index, allowing for positive and negative integers.
   * Negative integers count back from the last item in the collection.
   *
   * @param index - The index of the key to obtain
   */
  public keyAt(index: number): Key | undefined {
    index = Math.trunc(index);
    if (index >= 0) {
      if (index >= this.size) return undefined;
    } else {
      index += this.size;
      if (index < 0) return undefined;
    }

    const iter = this.keys();
    for (let skip = 0; skip < index; skip++) {
      iter.next();
    }

    return iter.next().value!;
  }

  /**
   * Obtains unique random value(s) from this collection.
   *
   * @param amount - Amount of values to obtain randomly
   * @returns A single value if no amount is provided or an array of values
   */
  public random(): Value | undefined;
  public random(amount: number): Value[];
  public random(amount?: number): Value | Value[] | undefined {
    if (amount === undefined)
      return this.at(Math.floor(Math.random() * this.size));
    amount = Math.min(this.size, amount);
    if (!amount) return [];

    const values = [...this.values()];
    for (let sourceIndex = 0; sourceIndex < amount; sourceIndex++) {
      const targetIndex =
        sourceIndex + Math.floor(Math.random() * (values.length - sourceIndex));
      [values[sourceIndex], values[targetIndex]] = [
        values[targetIndex]!,
        values[sourceIndex]!,
      ];
    }

    return values.slice(0, amount);
  }

  /**
   * Obtains unique random key(s) from this collection.
   *
   * @param amount - Amount of keys to obtain randomly
   * @returns A single key if no amount is provided or an array
   */
  public randomKey(): Key | undefined;
  public randomKey(amount: number): Key[];
  public randomKey(amount?: number): Key | Key[] | undefined {
    if (amount === undefined)
      return this.keyAt(Math.floor(Math.random() * this.size));
    amount = Math.min(this.size, amount);
    if (!amount) return [];

    const keys = [...this.keys()];
    for (let sourceIndex = 0; sourceIndex < amount; sourceIndex++) {
      const targetIndex =
        sourceIndex + Math.floor(Math.random() * (keys.length - sourceIndex));
      [keys[sourceIndex], keys[targetIndex]] = [
        keys[targetIndex]!,
        keys[sourceIndex]!,
      ];
    }

    return keys.slice(0, amount);
  }

  /**
   * Identical to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reverse | Array.reverse()}
   * but returns a Collection instead of an Array.
   */
  public reverse() {
    const entries = [...this.entries()].reverse();
    this.clear();
    for (const [key, value] of entries) this.set(key, value);
    return this;
  }

  /**
   * Searches for a single item where the given function returns a truthy value. This behaves like
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find | Array.find()}.
   * All collections used in Discord.js are mapped using their `id` property, and if you want to find by id you
   * should use the `get` method. See
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get | MDN} for details.
   *
   * @param fn - The function to test with (should return a boolean)
   * @param thisArg - Value to use as `this` when executing the function
   * @example
   * ```ts
   * collection.find(user => user.username === 'Bob');
   * ```
   */
  public find<NewValue extends Value>(
    fn: (value: Value, key: Key, collection: this) => value is NewValue
  ): NewValue | undefined;
  public find(
    fn: (value: Value, key: Key, collection: this) => unknown
  ): Value | undefined;
  public find<This, NewValue extends Value>(
    fn: (
      this: This,
      value: Value,
      key: Key,
      collection: this
    ) => value is NewValue,
    thisArg: This
  ): NewValue | undefined;
  public find<This>(
    fn: (this: This, value: Value, key: Key, collection: this) => unknown,
    thisArg: This
  ): Value | undefined;
  public find(
    fn: (value: Value, key: Key, collection: this) => unknown,
    thisArg?: unknown
  ): Value | undefined {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (thisArg !== undefined) fn = fn.bind(thisArg);
    for (const [key, val] of this) {
      if (fn(val, key, this)) return val;
    }

    return undefined;
  }

  /**
   * Searches for the key of a single item where the given function returns a truthy value. This behaves like
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex | Array.findIndex()},
   * but returns the key rather than the positional index.
   *
   * @param fn - The function to test with (should return a boolean)
   * @param thisArg - Value to use as `this` when executing the function
   * @example
   * ```ts
   * collection.findKey(user => user.username === 'Bob');
   * ```
   */
  public findKey<NewKey extends Key>(
    fn: (value: Value, key: Key, collection: this) => key is NewKey
  ): NewKey | undefined;
  public findKey(
    fn: (value: Value, key: Key, collection: this) => unknown
  ): Key | undefined;
  public findKey<This, NewKey extends Key>(
    fn: (this: This, value: Value, key: Key, collection: this) => key is NewKey,
    thisArg: This
  ): NewKey | undefined;
  public findKey<This>(
    fn: (this: This, value: Value, key: Key, collection: this) => unknown,
    thisArg: This
  ): Key | undefined;
  public findKey(
    fn: (value: Value, key: Key, collection: this) => unknown,
    thisArg?: unknown
  ): Key | undefined {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (thisArg !== undefined) fn = fn.bind(thisArg);
    for (const [key, val] of this) {
      if (fn(val, key, this)) return key;
    }

    return undefined;
  }

  /**
   * Searches for a last item where the given function returns a truthy value. This behaves like
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findLast | Array.findLast()}.
   *
   * @param fn - The function to test with (should return a boolean)
   * @param thisArg - Value to use as `this` when executing the function
   */
  public findLast<NewValue extends Value>(
    fn: (value: Value, key: Key, collection: this) => value is NewValue
  ): NewValue | undefined;
  public findLast(
    fn: (value: Value, key: Key, collection: this) => unknown
  ): Value | undefined;
  public findLast<This, NewValue extends Value>(
    fn: (
      this: This,
      value: Value,
      key: Key,
      collection: this
    ) => value is NewValue,
    thisArg: This
  ): NewValue | undefined;
  public findLast<This>(
    fn: (this: This, value: Value, key: Key, collection: this) => unknown,
    thisArg: This
  ): Value | undefined;
  public findLast(
    fn: (value: Value, key: Key, collection: this) => unknown,
    thisArg?: unknown
  ): Value | undefined {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (thisArg !== undefined) fn = fn.bind(thisArg);
    const entries = [...this.entries()];
    for (let index = entries.length - 1; index >= 0; index--) {
      const val = entries[index]![1];
      const key = entries[index]![0];
      if (fn(val, key, this)) return val;
    }

    return undefined;
  }

  /**
   * Searches for the key of a last item where the given function returns a truthy value. This behaves like
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findLastIndex | Array.findLastIndex()},
   * but returns the key rather than the positional index.
   *
   * @param fn - The function to test with (should return a boolean)
   * @param thisArg - Value to use as `this` when executing the function
   */
  public findLastKey<NewKey extends Key>(
    fn: (value: Value, key: Key, collection: this) => key is NewKey
  ): NewKey | undefined;
  public findLastKey(
    fn: (value: Value, key: Key, collection: this) => unknown
  ): Key | undefined;
  public findLastKey<This, NewKey extends Key>(
    fn: (this: This, value: Value, key: Key, collection: this) => key is NewKey,
    thisArg: This
  ): NewKey | undefined;
  public findLastKey<This>(
    fn: (this: This, value: Value, key: Key, collection: this) => unknown,
    thisArg: This
  ): Key | undefined;
  public findLastKey(
    fn: (value: Value, key: Key, collection: this) => unknown,
    thisArg?: unknown
  ): Key | undefined {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (thisArg !== undefined) fn = fn.bind(thisArg);
    const entries = [...this.entries()];
    for (let index = entries.length - 1; index >= 0; index--) {
      const key = entries[index]![0];
      const val = entries[index]![1];
      if (fn(val, key, this)) return key;
    }

    return undefined;
  }

  /**
   * Removes items that satisfy the provided filter function.
   *
   * @param fn - Function used to test (should return a boolean)
   * @param thisArg - Value to use as `this` when executing the function
   * @returns The number of removed entries
   */
  public sweep(
    fn: (value: Value, key: Key, collection: this) => unknown
  ): number;
  public sweep<This>(
    fn: (this: This, value: Value, key: Key, collection: this) => unknown,
    thisArg: This
  ): number;
  public sweep(
    fn: (value: Value, key: Key, collection: this) => unknown,
    thisArg?: unknown
  ): number {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (thisArg !== undefined) fn = fn.bind(thisArg);
    const previousSize = this.size;
    for (const [key, val] of this) {
      if (fn(val, key, this)) this.delete(key);
    }

    return previousSize - this.size;
  }

  /**
   * Identical to
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter | Array.filter()},
   * but returns a Collection instead of an Array.
   *
   * @param fn - The function to test with (should return a boolean)
   * @param thisArg - Value to use as `this` when executing the function
   * @example
   * ```ts
   * collection.filter(user => user.username === 'Bob');
   * ```
   */
  public filter<NewKey extends Key>(
    fn: (value: Value, key: Key, collection: this) => key is NewKey
  ): Collection<NewKey, Value>;
  public filter<NewValue extends Value>(
    fn: (value: Value, key: Key, collection: this) => value is NewValue
  ): Collection<Key, NewValue>;
  public filter(
    fn: (value: Value, key: Key, collection: this) => unknown
  ): Collection<Key, Value>;
  public filter<This, NewKey extends Key>(
    fn: (this: This, value: Value, key: Key, collection: this) => key is NewKey,
    thisArg: This
  ): Collection<NewKey, Value>;
  public filter<This, NewValue extends Value>(
    fn: (
      this: This,
      value: Value,
      key: Key,
      collection: this
    ) => value is NewValue,
    thisArg: This
  ): Collection<Key, NewValue>;
  public filter<This>(
    fn: (this: This, value: Value, key: Key, collection: this) => unknown,
    thisArg: This
  ): Collection<Key, Value>;
  public filter(
    fn: (value: Value, key: Key, collection: this) => unknown,
    thisArg?: unknown
  ): Collection<Key, Value> {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (thisArg !== undefined) fn = fn.bind(thisArg);
    const results = new this.constructor[Symbol.species]<Key, Value>();
    for (const [key, val] of this) {
      if (fn(val, key, this)) results.set(key, val);
    }

    return results;
  }

  /**
   * Partitions the collection into two collections where the first collection
   * contains the items that passed and the second contains the items that failed.
   *
   * @param fn - Function used to test (should return a boolean)
   * @param thisArg - Value to use as `this` when executing the function
   * @example
   * ```ts
   * const [big, small] = collection.partition(guild => guild.memberCount > 250);
   * ```
   */
  public partition<NewKey extends Key>(
    fn: (value: Value, key: Key, collection: this) => key is NewKey
  ): [Collection<NewKey, Value>, Collection<Exclude<Key, NewKey>, Value>];
  public partition<NewValue extends Value>(
    fn: (value: Value, key: Key, collection: this) => value is NewValue
  ): [Collection<Key, NewValue>, Collection<Key, Exclude<Value, NewValue>>];
  public partition(
    fn: (value: Value, key: Key, collection: this) => unknown
  ): [Collection<Key, Value>, Collection<Key, Value>];
  public partition<This, NewKey extends Key>(
    fn: (this: This, value: Value, key: Key, collection: this) => key is NewKey,
    thisArg: This
  ): [Collection<NewKey, Value>, Collection<Exclude<Key, NewKey>, Value>];
  public partition<This, NewValue extends Value>(
    fn: (
      this: This,
      value: Value,
      key: Key,
      collection: this
    ) => value is NewValue,
    thisArg: This
  ): [Collection<Key, NewValue>, Collection<Key, Exclude<Value, NewValue>>];
  public partition<This>(
    fn: (this: This, value: Value, key: Key, collection: this) => unknown,
    thisArg: This
  ): [Collection<Key, Value>, Collection<Key, Value>];
  public partition(
    fn: (value: Value, key: Key, collection: this) => unknown,
    thisArg?: unknown
  ): [Collection<Key, Value>, Collection<Key, Value>] {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (thisArg !== undefined) fn = fn.bind(thisArg);
    const results: [Collection<Key, Value>, Collection<Key, Value>] = [
      new this.constructor[Symbol.species]<Key, Value>(),
      new this.constructor[Symbol.species]<Key, Value>(),
    ];
    for (const [key, val] of this) {
      if (fn(val, key, this)) {
        results[0].set(key, val);
      } else {
        results[1].set(key, val);
      }
    }

    return results;
  }

  /**
   * Maps each item into a Collection, then joins the results into a single Collection. Identical in behavior to
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap | Array.flatMap()}.
   *
   * @param fn - Function that produces a new Collection
   * @param thisArg - Value to use as `this` when executing the function
   * @example
   * ```ts
   * collection.flatMap(guild => guild.members.cache);
   * ```
   */
  public flatMap<NewValue>(
    fn: (value: Value, key: Key, collection: this) => Collection<Key, NewValue>
  ): Collection<Key, NewValue>;
  public flatMap<NewValue, This>(
    fn: (
      this: This,
      value: Value,
      key: Key,
      collection: this
    ) => Collection<Key, NewValue>,
    thisArg: This
  ): Collection<Key, NewValue>;
  public flatMap<NewValue>(
    fn: (value: Value, key: Key, collection: this) => Collection<Key, NewValue>,
    thisArg?: unknown
  ): Collection<Key, NewValue> {
    // eslint-disable-next-line unicorn/no-array-method-this-argument
    const collections = this.map(fn, thisArg);
    return new this.constructor[Symbol.species]<Key, NewValue>().concat(
      ...collections
    );
  }

  /**
   * Maps each item to another value into an array. Identical in behavior to
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map | Array.map()}.
   *
   * @param fn - Function that produces an element of the new array, taking three arguments
   * @param thisArg - Value to use as `this` when executing the function
   * @example
   * ```ts
   * collection.map(user => user.tag);
   * ```
   */
  public map<NewValue>(
    fn: (value: Value, key: Key, collection: this) => NewValue
  ): NewValue[];
  public map<This, NewValue>(
    fn: (this: This, value: Value, key: Key, collection: this) => NewValue,
    thisArg: This
  ): NewValue[];
  public map<NewValue>(
    fn: (value: Value, key: Key, collection: this) => NewValue,
    thisArg?: unknown
  ): NewValue[] {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (thisArg !== undefined) fn = fn.bind(thisArg);
    const iter = this.entries();
    // eslint-disable-next-line unicorn/no-new-array
    const results: NewValue[] = new Array(this.size);
    for (let index = 0; index < this.size; index++) {
      const [key, value] = iter.next().value!;
      results[index] = fn(value, key, this);
    }

    return results;
  }

  /**
   * Maps each item to another value into a collection. Identical in behavior to
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map | Array.map()}.
   *
   * @param fn - Function that produces an element of the new collection, taking three arguments
   * @param thisArg - Value to use as `this` when executing the function
   * @example
   * ```ts
   * collection.mapValues(user => user.tag);
   * ```
   */
  public mapValues<NewValue>(
    fn: (value: Value, key: Key, collection: this) => NewValue
  ): Collection<Key, NewValue>;
  public mapValues<This, NewValue>(
    fn: (this: This, value: Value, key: Key, collection: this) => NewValue,
    thisArg: This
  ): Collection<Key, NewValue>;
  public mapValues<NewValue>(
    fn: (value: Value, key: Key, collection: this) => NewValue,
    thisArg?: unknown
  ): Collection<Key, NewValue> {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (thisArg !== undefined) fn = fn.bind(thisArg);
    const coll = new this.constructor[Symbol.species]<Key, NewValue>();
    for (const [key, val] of this) coll.set(key, fn(val, key, this));
    return coll;
  }

  /**
   * Checks if there exists an item that passes a test. Identical in behavior to
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some | Array.some()}.
   *
   * @param fn - Function used to test (should return a boolean)
   * @param thisArg - Value to use as `this` when executing the function
   * @example
   * ```ts
   * collection.some(user => user.discriminator === '0000');
   * ```
   */
  public some(
    fn: (value: Value, key: Key, collection: this) => unknown
  ): boolean;
  public some<This>(
    fn: (this: This, value: Value, key: Key, collection: this) => unknown,
    thisArg: This
  ): boolean;
  public some(
    fn: (value: Value, key: Key, collection: this) => unknown,
    thisArg?: unknown
  ): boolean {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (thisArg !== undefined) fn = fn.bind(thisArg);
    for (const [key, val] of this) {
      if (fn(val, key, this)) return true;
    }

    return false;
  }

  /**
   * Checks if all items passes a test. Identical in behavior to
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every | Array.every()}.
   *
   * @param fn - Function used to test (should return a boolean)
   * @param thisArg - Value to use as `this` when executing the function
   * @example
   * ```ts
   * collection.every(user => !user.bot);
   * ```
   */
  public every<NewKey extends Key>(
    fn: (value: Value, key: Key, collection: this) => key is NewKey
  ): this is Collection<NewKey, Value>;
  public every<NewValue extends Value>(
    fn: (value: Value, key: Key, collection: this) => value is NewValue
  ): this is Collection<Key, NewValue>;
  public every(
    fn: (value: Value, key: Key, collection: this) => unknown
  ): boolean;
  public every<This, NewKey extends Key>(
    fn: (this: This, value: Value, key: Key, collection: this) => key is NewKey,
    thisArg: This
  ): this is Collection<NewKey, Value>;
  public every<This, NewValue extends Value>(
    fn: (
      this: This,
      value: Value,
      key: Key,
      collection: this
    ) => value is NewValue,
    thisArg: This
  ): this is Collection<Key, NewValue>;
  public every<This>(
    fn: (this: This, value: Value, key: Key, collection: this) => unknown,
    thisArg: This
  ): boolean;
  public every(
    fn: (value: Value, key: Key, collection: this) => unknown,
    thisArg?: unknown
  ): boolean {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (thisArg !== undefined) fn = fn.bind(thisArg);
    for (const [key, val] of this) {
      if (!fn(val, key, this)) return false;
    }

    return true;
  }

  /**
   * Applies a function to produce a single value. Identical in behavior to
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce | Array.reduce()}.
   *
   * @param fn - Function used to reduce, taking four arguments; `accumulator`, `currentValue`, `currentKey`,
   * and `collection`
   * @param initialValue - Starting value for the accumulator
   * @example
   * ```ts
   * collection.reduce((acc, guild) => acc + guild.memberCount, 0);
   * ```
   */
  public reduce(
    fn: (accumulator: Value, value: Value, key: Key, collection: this) => Value,
    initialValue?: Value
  ): Value;
  public reduce<InitialValue>(
    fn: (
      accumulator: InitialValue,
      value: Value,
      key: Key,
      collection: this
    ) => InitialValue,
    initialValue: InitialValue
  ): InitialValue;
  public reduce<InitialValue>(
    fn: (
      accumulator: InitialValue,
      value: Value,
      key: Key,
      collection: this
    ) => InitialValue,
    initialValue?: InitialValue
  ): InitialValue {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    let accumulator!: InitialValue;

    const iterator = this.entries();
    if (initialValue === undefined) {
      if (this.size === 0)
        throw new TypeError("Reduce of empty collection with no initial value");
      accumulator = iterator.next().value![1] as unknown as InitialValue;
    } else {
      accumulator = initialValue;
    }

    for (const [key, value] of iterator) {
      accumulator = fn(accumulator, value, key, this);
    }

    return accumulator;
  }

  /**
   * Applies a function to produce a single value. Identical in behavior to
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduceRight | Array.reduceRight()}.
   *
   * @param fn - Function used to reduce, taking four arguments; `accumulator`, `value`, `key`, and `collection`
   * @param initialValue - Starting value for the accumulator
   */
  public reduceRight(
    fn: (accumulator: Value, value: Value, key: Key, collection: this) => Value,
    initialValue?: Value
  ): Value;
  public reduceRight<InitialValue>(
    fn: (
      accumulator: InitialValue,
      value: Value,
      key: Key,
      collection: this
    ) => InitialValue,
    initialValue: InitialValue
  ): InitialValue;
  public reduceRight<InitialValue>(
    fn: (
      accumulator: InitialValue,
      value: Value,
      key: Key,
      collection: this
    ) => InitialValue,
    initialValue?: InitialValue
  ): InitialValue {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    const entries = [...this.entries()];
    let accumulator!: InitialValue;

    let index: number;
    if (initialValue === undefined) {
      if (entries.length === 0)
        throw new TypeError("Reduce of empty collection with no initial value");
      accumulator = entries[entries.length - 1]![1] as unknown as InitialValue;
      index = entries.length - 1;
    } else {
      accumulator = initialValue;
      index = entries.length;
    }

    while (--index >= 0) {
      const key = entries[index]![0];
      const val = entries[index]![1];
      accumulator = fn(accumulator, val, key, this);
    }

    return accumulator;
  }

  /**
   * Identical to
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/forEach | Map.forEach()},
   * but returns the collection instead of undefined.
   *
   * @param fn - Function to execute for each element
   * @param thisArg - Value to use as `this` when executing the function
   * @example
   * ```ts
   * collection
   *  .each(user => console.log(user.username))
   *  .filter(user => user.bot)
   *  .each(user => console.log(user.username));
   * ```
   */
  public each(fn: (value: Value, key: Key, collection: this) => void): this;
  public each<This>(
    fn: (this: This, value: Value, key: Key, collection: this) => void,
    thisArg: This
  ): this;
  public each(
    fn: (value: Value, key: Key, collection: this) => void,
    thisArg?: unknown
  ): this {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (thisArg !== undefined) fn = fn.bind(thisArg);

    for (const [key, value] of this) {
      fn(value, key, this);
    }

    return this;
  }

  /**
   * Runs a function on the collection and returns the collection.
   *
   * @param fn - Function to execute
   * @param thisArg - Value to use as `this` when executing the function
   * @example
   * ```ts
   * collection
   *  .tap(coll => console.log(coll.size))
   *  .filter(user => user.bot)
   *  .tap(coll => console.log(coll.size))
   * ```
   */
  public tap(fn: (collection: this) => void): this;
  public tap<This>(
    fn: (this: This, collection: this) => void,
    thisArg: This
  ): this;
  public tap(fn: (collection: this) => void, thisArg?: unknown): this {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (thisArg !== undefined) fn = fn.bind(thisArg);
    fn(this);
    return this;
  }

  /**
   * Creates an identical shallow copy of this collection.
   *
   * @example
   * ```ts
   * const newColl = someColl.clone();
   * ```
   */
  public clone(): Collection<Key, Value> {
    return new this.constructor[Symbol.species](this);
  }

  /**
   * Combines this collection with others into a new collection. None of the source collections are modified.
   *
   * @param collections - Collections to merge
   * @example
   * ```ts
   * const newColl = someColl.concat(someOtherColl, anotherColl, ohBoyAColl);
   * ```
   */
  public concat(...collections: ReadonlyCollection<Key, Value>[]) {
    const newColl = this.clone();
    for (const coll of collections) {
      for (const [key, val] of coll) newColl.set(key, val);
    }

    return newColl;
  }

  /**
   * Checks if this collection shares identical items with another.
   * This is different to checking for equality using equal-signs, because
   * the collections may be different objects, but contain the same data.
   *
   * @param collection - Collection to compare with
   * @returns Whether the collections have identical contents
   */
  public equals(collection: ReadonlyCollection<Key, Value>) {
    if (!collection) return false; // runtime check
    if (this.backingObject === collection) return true;
    if (this.size !== collection.size) return false;
    for (const [key, value] of this) {
      if (!collection.has(key) || value !== collection.get(key)) {
        return false;
      }
    }

    return true;
  }

  /**
   * The sort method sorts the items of a collection in place and returns it.
   * If a comparison function is not provided, the function sorts by element values, using the same stringwise comparison algorithm as
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort | Array.sort()}.
   *
   * @param compareFunction - Specifies a function that defines the sort order. The return value of this function should be negative if
   * `a` comes before `b`, positive if `b` comes before `a`, or zero if `a` and `b` are considered equal.
   * @example
   * ```ts
   * collection.sort((userA, userB) => userA.createdTimestamp - userB.createdTimestamp);
   * ```
   */
  public sort(
    compareFunction: any = (Collection as any).defaultSort
  ) {
    const entries = [...this.entries()];
    entries.sort((a, b): number => compareFunction(a[1], b[1], a[0], b[0]));

    // Perform clean-up
    this.clear();

    // Set the new entries
    for (const [key, value] of entries) {
      this.set(key, value);
    }

    return this;
  }

  /**
   * The intersection method returns a new collection containing the items where the key is present in both collections.
   *
   * @param other - The other Collection to filter against
   * @example
   * ```ts
   * const col1 = new Collection([['a', 1], ['b', 2]]);
   * const col2 = new Collection([['a', 1], ['c', 3]]);
   * const intersection = col1.intersection(col2);
   * console.log(col1.intersection(col2));
   * // => Collection { 'a' => 1 }
   * ```
   */
  public intersection(
    other: ReadonlyCollection<Key, any>
  ): Collection<Key, Value> {
    const coll = new this.constructor[Symbol.species]<Key, Value>();

    for (const [key, value] of this) {
      if (other.has(key)) coll.set(key, value);
    }

    return coll;
  }

  /**
   * Returns a new collection containing the items where the key is present in either of the collections.
   *
   * @remarks
   *
   * If the collections have any items with the same key, the value from the first collection will be used.
   * @param other - The other Collection to filter against
   * @example
   * ```ts
   * const col1 = new Collection([['a', 1], ['b', 2]]);
   * const col2 = new Collection([['a', 1], ['b', 3], ['c', 3]]);
   * const union = col1.union(col2);
   * console.log(union);
   * // => Collection { 'a' => 1, 'b' => 2, 'c' => 3 }
   * ```
   */
  public union<OtherValue>(
    other: ReadonlyCollection<Key, OtherValue>
  ): Collection<Key, OtherValue | Value> {
    const coll = new this.constructor[Symbol.species]<Key, OtherValue | Value>(
      this
    );

    for (const [key, value] of other) {
      if (!coll.has(key)) coll.set(key, value);
    }

    return coll;
  }

  /**
   * Returns a new collection containing the items where the key is present in this collection but not the other.
   *
   * @param other - The other Collection to filter against
   * @example
   * ```ts
   * const col1 = new Collection([['a', 1], ['b', 2]]);
   * const col2 = new Collection([['a', 1], ['c', 3]]);
   * console.log(col1.difference(col2));
   * // => Collection { 'b' => 2 }
   * console.log(col2.difference(col1));
   * // => Collection { 'c' => 3 }
   * ```
   */
  public difference(
    other: ReadonlyCollection<Key, any>
  ): Collection<Key, Value> {
    const coll = new this.constructor[Symbol.species]<Key, Value>();

    for (const [key, value] of this) {
      if (!other.has(key)) coll.set(key, value);
    }

    return coll;
  }

  /**
   * Returns a new collection containing only the items where the keys are present in either collection, but not both.
   *
   * @param other - The other Collection to filter against
   * @example
   * ```ts
   * const col1 = new Collection([['a', 1], ['b', 2]]);
   * const col2 = new Collection([['a', 1], ['c', 3]]);
   * const symmetricDifference = col1.symmetricDifference(col2);
   * console.log(col1.symmetricDifference(col2));
   * // => Collection { 'b' => 2, 'c' => 3 }
   * ```
   */
  public symmetricDifference<OtherValue>(
    other: ReadonlyCollection<Key, OtherValue>
  ): Collection<Key, OtherValue | Value> {
    const coll = new this.constructor[Symbol.species]<
      Key,
      OtherValue | Value
    >();

    for (const [key, value] of this) {
      if (!other.has(key)) coll.set(key, value);
    }

    for (const [key, value] of other) {
      if (!this.has(key)) coll.set(key, value);
    }

    return coll;
  }

  /**
   * Merges two Collections together into a new Collection.
   *
   * @param other - The other Collection to merge with
   * @param whenInSelf - Function getting the result if the entry only exists in this Collection
   * @param whenInOther - Function getting the result if the entry only exists in the other Collection
   * @param whenInBoth - Function getting the result if the entry exists in both Collections
   * @example
   * ```ts
   * // Sums up the entries in two collections.
   * coll.merge(
   *  other,
   *  x => ({ keep: true, value: x }),
   *  y => ({ keep: true, value: y }),
   *  (x, y) => ({ keep: true, value: x + y }),
   * );
   * ```
   * @example
   * ```ts
   * // Intersects two collections in a left-biased manner.
   * coll.merge(
   *  other,
   *  x => ({ keep: false }),
   *  y => ({ keep: false }),
   *  (x, _) => ({ keep: true, value: x }),
   * );
   * ```
   */
  public merge<OtherValue, ResultValue>(
    other: ReadonlyCollection<Key, OtherValue>,
    whenInSelf: (value: Value, key: Key) => any,
    whenInOther: (valueOther: OtherValue, key: Key) => any,
    whenInBoth: (
      value: Value,
      valueOther: OtherValue,
      key: Key
    ) => any
  ): Collection<Key, ResultValue> {
    const coll = new this.constructor[Symbol.species]<Key, ResultValue>();
    const keys = new Set([...this.keys(), ...other.keys()]);

    for (const key of keys) {
      const hasInSelf = this.has(key);
      const hasInOther = other.has(key);

      if (hasInSelf) {
        if (hasInOther) {
          const result = whenInBoth(this.get(key)!, other.get(key)!, key);
          if (result.keep) coll.set(key, result.value);
        } else {
          const result = whenInSelf(this.get(key)!, key);
          if (result.keep) coll.set(key, result.value);
        }
      } else if (hasInOther) {
        const result = whenInOther(other.get(key)!, key);
        if (result.keep) coll.set(key, result.value);
      }
    }

    return coll;
  }

  /**
   * Identical to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toReversed | Array.toReversed()}
   * but returns a Collection instead of an Array.
   */
  public toReversed() {
    return new this.constructor[Symbol.species](this).reverse();
  }

  /**
   * The toSorted method returns a shallow copy of the collection with the items sorted.
   * If a comparison function is not provided, the function sorts by element values, using the same stringwise comparison algorithm as
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort | Array.sort()}.
   *
   * @param compareFunction - Specifies a function that defines the sort order. The return value of this function should be negative if
   * `a` comes before `b`, positive if `b` comes before `a`, or zero if `a` and `b` are considered equal.
   * @example
   * ```ts
   * const sortedCollection = collection.toSorted((userA, userB) => userA.createdTimestamp - userB.createdTimestamp);
   * ```
   */
  public toSorted(
    compareFunction: any = (Collection as any).defaultSort
  ): Collection<Key, Value> {
    return new this.constructor[Symbol.species](this).sort(compareFunction);
  }

  
  sorted(compareFunction: any = (Collection as any).defaultSort): Collection<Key, Value> {
    return new this.constructor[Symbol.species](this).sort(compareFunction);
  }

  public toJSON() {
    // toJSON is called recursively by JSON.stringify.
    return [...this.values()];
  }

  /**
   * Emulates the default sort comparison algorithm used in ECMAScript. Equivalent to calling the
   * {@link https://tc39.es/ecma262/multipage/indexed-collections.html#sec-comparearrayelements | CompareArrayElements}
   * operation with arguments `firstValue`, `secondValue` and `undefined`.
   */
  private static defaultSort<Value>(
    firstValue: Value,
    secondValue: Value
  ): number {
    if (firstValue === undefined) return secondValue === undefined ? 0 : 1;
    if (secondValue === undefined) return -1;

    const x = String(firstValue);
    const y = String(secondValue);
    if (x < y) return -1;
    if (y < x) return 1;
    return 0;
  }

  /**
   * Creates a Collection from a list of entries.
   *
   * @param entries - The list of entries
   * @param combine - Function to combine an existing entry with a new one
   * @example
   * ```ts
   * Collection.combineEntries([["a", 1], ["b", 2], ["a", 2]], (x, y) => x + y);
   * // returns Collection { "a" => 3, "b" => 2 }
   * ```
   */
  public static combineEntries<Key, Value>(
    entries: Iterable<[Key, Value]>,
    combine: (firstValue: Value, secondValue: Value, key: Key) => Value
  ): Collection<Key, Value> {
    const coll = new Collection<Key, Value>();
    for (const [key, value] of entries) {
      if (coll.has(key)) {
        coll.set(key, combine(coll.get(key)!, value, key));
      } else {
        coll.set(key, value);
      }
    }

    return coll;
  }
}
