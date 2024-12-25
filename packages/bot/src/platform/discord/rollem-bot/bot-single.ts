// these must be the first imported items
import "reflect-metadata";
import nodeFetch from 'node-fetch';
global.fetch = nodeFetch as any;

import { Newable } from "../../../common/util/types/utility-types";
import { DiscordBehaviorBase } from "./behaviors/discord.behavior.base";
import { DeadmanSwitchBehavior } from "./behaviors/deadman-switch";
import { DieOnDisconnectBehavior } from "./behaviors/die-on-disconnect.behavior";
import { DieOnErrorBehavior } from "./behaviors/die-on-error.behavior";
import { HeartbeatBehavior } from "./behaviors/heartbeat.behavior.behavior";
import { Bootstrapper } from "./bootstrap";
import { StandardAdapter } from "./behaviors/standard-adapter.behavior";
import { BehaviorBase } from "@common/standard-behaviors/behavior.base";
import { PingPongBehavior } from "@common/standard-behaviors/behaviors/ping-pong.behavior";
import { StatsBehavior } from "@common/standard-behaviors/behaviors/stats.behavior";
import { ChangelogBehavior } from "@common/standard-behaviors/behaviors/changelog.behavior";
import { DiceBracketedBehavior } from "@common/standard-behaviors/behaviors/dice/dice-bracketed.behavior";
import { DiceShortPrefixedBehavior } from "@common/standard-behaviors/behaviors/dice/dice-short-prefixed.behavior";
import { DiceSoftParseBehavior } from "@common/standard-behaviors/behaviors/dice/dice-soft-parse.behavior";
import { DiceTaggedBehavior } from "@common/standard-behaviors/behaviors/dice/dice-tagged.behavior";
import { StorageBehavior } from "@common/standard-behaviors/behaviors/storage.behavior";
import { EventMonitorBehavior } from "./behaviors/event-monitor.behavior";

const ORDERED_STANDARD_BEHAVIORS: Newable<BehaviorBase>[] = [
  PingPongBehavior,
  StatsBehavior,
  ChangelogBehavior,
  StorageBehavior,
  DiceBracketedBehavior,
  DiceShortPrefixedBehavior,
  DiceSoftParseBehavior,
  DiceTaggedBehavior,
];

/** The behaviors in the order in which they will be loaded. */
const ORDERED_DISCORD_BEHAVIORS: Newable<DiscordBehaviorBase>[] = [
  DieOnDisconnectBehavior,
  DieOnErrorBehavior,
  HeartbeatBehavior,
  DeadmanSwitchBehavior,
  EventMonitorBehavior,
  StandardAdapter,
];

export async function bootstrapSingleBot() {
  const topLevelInjector    = Bootstrapper.buildTopLevelProviders();
                              await Bootstrapper.prepareStorage(topLevelInjector);
                              Bootstrapper.prepareChangelog(topLevelInjector);
  const client              = Bootstrapper.prepareClient(topLevelInjector);
  const clientLevelInjector = Bootstrapper.createClientContext(topLevelInjector, client, ORDERED_STANDARD_BEHAVIORS, ORDERED_DISCORD_BEHAVIORS);
                              await Bootstrapper.attachBehaviorsToClient(clientLevelInjector, ORDERED_DISCORD_BEHAVIORS);
                              Bootstrapper.startClient(clientLevelInjector);
}
