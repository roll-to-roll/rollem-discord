import { Collection, Guild, GuildManager } from "discord.js";
import { pick } from "lodash";
import { KeepMapCollection, KeepMapCollectionOptionsFromManager } from "@root/platform/discord/client/cache/base-collections/keepmap-collection";
import { ManagerKey, ManagerHolds } from "@root/platform/discord/client/cache/base-collections/types";


/** A hook for Guild Cache tweaks. All I've attempted cause discord.js to break. */
export class GuildCollection extends KeepMapCollection<ManagerKey<GuildManager>, ManagerHolds<GuildManager>> {
  public get config() {
    return GuildCollection.CONFIG;
  }

  public static CONFIG: KeepMapCollectionOptionsFromManager<GuildManager> = {
    // mapFn: (value) => {
    //   debugger;
    //   const oldPatch = (value as any)._patch
    //   (value as any)._patch = function (this: Guild, data) { return oldPatch(data).bind(this); }.bind(value);
    //   (value as any)._patch.bind(value);
    //   return value;
    // }
  };

  /**
   * A hook to control clone operations.
   * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/species.
   */
  public static get [Symbol.species]() {
    return Collection;
  }
}