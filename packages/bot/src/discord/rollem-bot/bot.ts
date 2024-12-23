// these must be the first imported items
import "reflect-metadata";
import nodeFetch from 'node-fetch';
global.fetch = nodeFetch as any;

import { Newable } from "./lib/utility-types";
import { DiscordBehaviorBase } from "./behaviors/discord-behavior-base";
import { DeadmanSwitchBehavior } from "./behaviors/deadman-switch";
import { DieOnDisconnectBehavior } from "./behaviors/die-on-disconnect.behavior";
import { DieOnErrorBehavior } from "./behaviors/die-on-error.behavior";
import { HeartbeatBehavior } from "./behaviors/heartbeat.behavior";
import { Bootstrapper } from "./bootstrap";
import { StandardAdapter } from "./behaviors/standard-adapter";
import { BehaviorBase } from "@common/behavior.base";
import { PingPongBehavior } from "@common/behaviors/ping-pong.behavior";
import { StatsBehavior } from "@common/behaviors/stats.behavior";
import { ChangelogBehavior } from "@common/behaviors/changelog.behavior";
import { DiceBracketedBehavior } from "@common/behaviors/dice/dice-bracketed.behavior";
import { DiceShortPrefixedBehavior } from "@common/behaviors/dice/dice-short-prefixed.behavior";
import { DiceSoftParseBehavior } from "@common/behaviors/dice/dice-soft-parse.behavior";
import { DiceTaggedBehavior } from "@common/behaviors/dice/dice-tagged.behavior";
import { StorageBehavior } from "@common/behaviors/storage.behavior";
import { EventMonitorBehavior } from "./behaviors/event-monitor";

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
