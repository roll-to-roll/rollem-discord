// these must be the first imported items
import "reflect-metadata";
import nodeFetch from 'node-fetch';
import util from 'util';
global.fetch = nodeFetch as any;

import { bootstrapShardedBot } from "@bot/bot-sharded";

bootstrapShardedBot();