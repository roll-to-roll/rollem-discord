import { RollemApiError, RollemConfigError } from "@root/errors";
import { APIGatewayBotInfo, RouteBases, Routes } from "discord.js";

/**
 * Gets the gateway bot response.
 * 
 * @remarks
 * See https://discord.com/developers/docs/events/gateway#get-gateway-bot
 * Based off fetchRecommendedShardCount https://github.com/discordjs/discord.js/blob/c484e3de250e2ed52f9651b1fc7f2b27990ef632/packages/discord.js/src/util/Util.js#L68
 */
export async function fetchGatewayBotInfo(token): Promise<APIGatewayBotInfo> {
  if (!token) throw new RollemConfigError({ message: "Token not provided" });
  const response = await fetch(RouteBases.api + Routes.gatewayBot(), {
    method: 'GET',
    headers: { Authorization: `Bot ${token.replace(/^Bot\s*/i, '')}` },
  });

  if (!response.ok) {
    if (response.status === 401) throw new RollemApiError({ message: "Token not accepted", context: response });
    throw new RollemApiError({ message: "Unknown API error", context: response });
  }
  const result: APIGatewayBotInfo = await response.json();
  return result;
}