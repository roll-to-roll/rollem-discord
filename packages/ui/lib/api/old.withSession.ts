import { User } from '@rollem/common';
import { IncomingMessage } from 'http';
import { NextApiRequest } from 'next';
import { DiscordTokenRequestResult } from '../discord-oauth';
import OAuth from 'discord-oauth2';

export interface DiscordSessionData {
  auth: DiscordTokenRequestResult;
  user: OAuth.User,
  guilds: OAuth.PartialGuild[];
  expires_at: Date,
}

export interface RollemData {
  user: User,
}

export interface RollemSessionData {
  discord: DiscordSessionData;
  data: RollemData,
}

export interface SessionThin {
  id: string;
  commit(): Promise<void>;
  destroy(): Promise<void>;
  isNew: boolean;
}

export type RollemApiRequest<T> = NextApiRequest & {
  session: SessionThin & T
};

export type RollemIncomingMessage<T> = IncomingMessage & {
  session?: SessionThin & T
};