import { Collection, Role, RoleManager } from "discord.js";
import { pick } from "lodash";
import { KeepMapCollection, KeepMapCollectionOptionsFromManager } from "@root/platform/discord/client/cache/base-collections/keepmap-collection";
import { ManagerKey, ManagerHolds } from "@root/platform/discord/client/cache/base-collections/types";

/** A collection for Roles which only stores those that we're interested in, and then only ID + Name. */
export class RoleCollection extends KeepMapCollection<ManagerKey<RoleManager>, ManagerHolds<RoleManager>> {
  public get config() {
    return RoleCollection.CONFIG;
  }

  public static CONFIG: KeepMapCollectionOptionsFromManager<RoleManager> = {
    keepFn: (value) => {
      const isEveryone = value.name === '@everyone' || value.id === value?.guild?.id;
      const isRollemRole = value.name.startsWith('rollem:prefix:')
      return (isEveryone || isRollemRole);
    },

    mapFn: (value) => pick(value, ['id', 'name']) as Partial<Role>
  };

  /**
   * A hook to control clone operations.
   * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/species.
   */
  public static get [Symbol.species]() {
    return Collection;
  }
}
