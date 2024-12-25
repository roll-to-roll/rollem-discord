import express from 'express';
import * as client from 'prom-client';
import { Config } from '../../../platform/discord/rollem-bot/discord-config.service';
import { Server } from 'http';

const app = express();
const port = 8081;

// standard prometheus metrics
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

app.get('/', async (req, res) => {
  try {
    const config = new Config();
    res.status(200).end(JSON.stringify({
      time: new Date().toISOString(),
      shard: config.ShardLabel,
    }, null, '  '));
  } catch (ex) {
    res.status(500).end(ex);
  }
});

const server: Server | undefined = undefined;; 

/** The express app. */
export class PromLoggerApi {
  private readonly app = app;

  constructor() {
    if (!server) {
      const server = this.app.listen(port, () => {
        console.log(`listening on port ${port}.`);
      });
    }
  }
}