import { CachedManager, Client, Collection, Constructable, DataManager } from "discord.js"

const OldCachedManager = CachedManager;

export class RollemCachedManager<Key, Holds, Resolvable> extends DataManager<Key, Holds, Resolvable> {
  protected constructor(client: Client<true>, holds: Constructable<Holds>, iterable?: Iterable<Holds>) {
    console.debug("MONKEYPATCH");
    super(client, holds);
    // debugger;
    // Object.defineProperty(this, '_cache', {
    //   value: (this.client.options.makeCache as any)!(
    //     this.constructor as any,
    //     this.holds as any,
    //     this.constructor as any,
    //     this,
    //   ),
    // });
  }
}

// Object.setPrototypeOf(CachedManager.prototype, RollemCachedManager.prototype);
// CachedManager.prototype.constructor = RollemCachedManager;
// console.debug("Trying to monkeypatch", CachedManager.);