// these must be the first imported items
import "reflect-metadata";
import nodeFetch from 'node-fetch';
import util from 'util';
global.fetch = nodeFetch as any;

import { bootstrapShardedBot } from "@root/platform/discord/rollem-bot/bot-sharded";

bootstrapShardedBot();