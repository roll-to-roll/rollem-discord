import NodeCache from "node-cache";
import { Injectable } from "injection-js";
import { Message } from "discord.js";

/**
 * A cache for messages we've replied to, so we don't reply twice.
 */
@Injectable()
export class RepliedMessageCache extends NodeCache {
  constructor() {
    super({
      stdTTL: 5, // seconds
      checkperiod: 5, // seconds
      deleteOnExpire: true,
      useClones: false, // go fast
    });
  }

  /** Returns false the first time it's passed a message, and then true after. */
  public hasSeenMessageBefore(message: Message, type: string): boolean {
    const key = `${message.guild?.id}-${message.channel?.id}-${message.id}-${type}`
    if (this.has(key)) {
      return true;
    }

    this.set(key, true);
    return false;
  }
}