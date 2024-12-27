import { ChannelManager, Collection } from "discord.js";
import { KeepMapCollection, KeepMapCollectionOptionsFromManager } from "@root/platform/discord/client/cache/base-collections/keepmap-collection";
import { ManagerKey, ManagerHolds } from "@root/platform/discord/client/cache/base-collections/types";

/** A cache for channels that rejects anything that is not a text channel. */
export class ChannelCollection extends KeepMapCollection<ManagerKey<ChannelManager>, ManagerHolds<ChannelManager>> {
  public get config() {
    return ChannelCollection.CONFIG;
  }

  public static CONFIG: KeepMapCollectionOptionsFromManager<ChannelManager> = {
    keepFn: (value) => {
      return value.isTextBased();
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
