import { Collection, GuildMemberManager } from "discord.js";
import { KeepMapCollection, KeepMapCollectionOptionsFromManager } from "@root/platform/discord/client/cache/base-collections/keepmap-collection";
import { ManagerKey, ManagerHolds } from "@root/platform/discord/client/cache/base-collections/types";


/** A collection for Guild Members which only stores ourselves. */
export class GuildMemberCollection extends KeepMapCollection<ManagerKey<GuildMemberManager>, ManagerHolds<GuildMemberManager>> {
  public get config() {
    return GuildMemberCollection.CONFIG;
  }

  public static CONFIG: KeepMapCollectionOptionsFromManager<GuildMemberManager> = {
    keepFn: (value) => {
      return value.id == value.client.user.id;
    }
  };

  /**
   * A hook to control clone operations.
   * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/species.
   */
  public static get [Symbol.species]() {
    return Collection;
  }
}