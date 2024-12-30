
import { ClientEvents, Snowflake } from "discord.js";

/** Model containing Discord.js -related context for the active Event. */
export interface RollemContextInterface {
  /** True when the initiator was a bot. */
  isBot?: boolean,

  /** True when the initiator was Rollem itself. */
  isRollem?: boolean,

  /** Contains label for this ShardSet. */
  shardSet?: string,

  /** Contains label for this Shard. */
  shard?: string,

  /** Contains Guild ID. */
  guild?: Snowflake,

  /** Contains Channel ID. */
  channel?: Snowflake,

  /** Contains Message ID. */
  message?: Snowflake,

  /** Contains Author ID. */
  author?: Snowflake,

  /** Contains Event NAme. */
  event?: keyof ClientEvents,
}