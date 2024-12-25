import { Logger } from "@root/platform/discord/rollem-bot/logger";
import { PromLogger } from "@common/prom-logger";
import { BehaviorStatsBase, BotStats } from "@common/standard-behaviors/stats-base";
import { Client } from "discord.js";
import { Injectable } from "injection-js";
import moment from "moment";
import { Gauge } from "prom-client";

export interface DiscordRawBotStats {
  shard?: string,
  uptime: moment.Duration;
  servers: number;
  users: number;
}

/** Produces stats for display with the discord bot. */
@Injectable()
export class DiscordStats extends BehaviorStatsBase {
  private readonly serverCountGauge: Gauge;
  private readonly userCountGauge: Gauge;
  private readonly memberCountByServerGauge: Gauge;
  private readonly botUserCountByServerGauge: Gauge;
  private readonly realUserCountByServerGauge: Gauge;

  constructor(
    private readonly logger: Logger,
    private readonly promLogger: PromLogger,
    private readonly client: Client,
  ) {
    super();
    const self = this;

    this.serverCountGauge = new promLogger.client.Gauge({
      name: 'rollem_servers',
      help: 'The number of known-servers on this shard.',
      async collect() {
        if (self.client.isReady()) {
          console.log("server count collected");
          const stats = await self.getRawStats();
          this.set(stats.servers)
        }
      }
    });

    this.userCountGauge = new promLogger.client.Gauge({
      name: 'rollem_users',
      help: 'The number of known-users on this shard.',
      async collect() {
        if (self.client.isReady()) {
          console.log("user count collected");
          const stats = await self.getRawStats();
          this.set(stats.users)
        }
      }
    });

    this.memberCountByServerGauge = new promLogger.client.Gauge({
      name: 'rollem_server_member_count',
      help: 'The discord-provided Member Count for a server.',
      labelNames: ['guild_id'],
      async collect() {
        if (self.client.isReady()) {
          console.log("user count by server collected");
          for (const guild of self.client.guilds.cache.values()) {
            const userCount = guild.memberCount;
            this.set({ guild_id: guild.id }, userCount);
          }
        }
      }
    });

    this.botUserCountByServerGauge = new promLogger.client.Gauge({
      name: 'rollem_server_bot_users',
      help: 'The cache-known users on this server that are bots.',
      labelNames: ['guild_id'],
      async collect() {
        if (self.client.isReady()) {
          console.log("user count by server collected");
          for (const guild of self.client.guilds.cache.values()) {
            const botCount = guild.members.cache.filter(m => m?.user?.bot).size;
            this.set({ guild_id: guild.id }, botCount);
          }
        }
      }
    });

    this.realUserCountByServerGauge = new promLogger.client.Gauge({
      name: 'rollem_server_real_users',
      help: 'The cache-known users on this server that are NOT bots.',
      labelNames: ['guild_id'],
      async collect() {
        if (self.client.isReady()) {
          console.log("user count by server collected");
          for (const guild of self.client.guilds.cache.values()) {
            const realUserCount = guild.members.cache.filter(m => !m?.user?.bot).size;
            this.set({ guild_id: guild.id }, realUserCount);
          }
        }
      }
    });
  }

  public async getRawStats(): Promise<DiscordRawBotStats> {
    const uptime = moment.duration(this.client.uptime);

    return {
      shard: this.logger.shardName(),
      uptime,
      servers: this.client.guilds.cache.size,
      users: this.client.users.cache.size,
    }
  }

  public async getStats(): Promise<BotStats<keyof DiscordRawBotStats>> {
    const stats = await this.getRawStats();

    return {
      shard: stats.shard?.toString() ?? 'unknown',
      uptime: `${stats.uptime.days()}d ${stats.uptime.hours()}h ${stats.uptime.minutes()}m ${stats.uptime.seconds()}s`,
      servers: `${stats.servers}`,
      users: `${stats.users}`,
    }
  }

}