import DiscordOauth2 from 'discord-oauth2';
import util from 'util';
const config = {
  clientId: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  redirectUri: process.env.DISCORD_REDIRECT_URI,
  db_connection: process.env.DB_CONNECTION_STRING,
};
console.log(config);
const oauth = new DiscordOauth2(config);
import { Storage } from '@rollem/common/dist/storage/storage';

import { NextApiRequest, NextApiResponse } from "next";

const storage = new Storage();
const storageInitialize$ = storage.initialize();

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await storageInitialize$;
  // console.log(util.inspect(req, true, null, true));
  const code = req.query['code'] as string;
  // console.log(code);
  try {
    const response = await oauth.tokenRequest({
      code: code,
      scope: 'identify guilds',
      grantType: 'authorization_code'});
    
    // console.log(util.inspect(res, true, null, true))
    const user = await oauth.getUser(response.access_token);
    const guilds = await oauth.getUserGuilds(response.access_token);
    const userData = await storage.getOrCreateUser(user.id);
    // const userData = null;
    res.status(200).json({ user: user, userData: userData, guilds: guilds})
  } catch(ex) {
    console.error(ex);
    res.status(500);
  }
}