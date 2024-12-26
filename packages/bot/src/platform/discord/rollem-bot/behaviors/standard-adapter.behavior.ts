import { Client, Message } from "discord.js";
import { Logger, LoggerCategory } from "@common/services/logger.service/logger.service";
import { Inject, Injectable } from "injection-js";
import { BehaviorBase } from "@common/standard-behaviors/behavior.base";
import { Config } from "../discord-config.service";
import { RepliedMessageCache } from "../lib/replied-message-cache.service";
import { BehaviorContext, DatabaseFailure, ParserVersion, PrefixStyle } from "@common/standard-behaviors/types/behavior-context";
import { Storage, User } from "@rollem/common";
import { DiscordBehaviorBase } from './discord.behavior.base';
import { BehaviorResponse } from "@common/standard-behaviors/types/behavior-response";
import { PromLogger } from "@common/services/prom-logger.service/prom-logger.service";
import { DiscordClientService } from "@bot/discord-client.service";

/** A base for behaviors to be applied to a discord client. */
@Injectable()
export class StandardAdapter extends DiscordBehaviorBase {
  constructor(
    client: DiscordClientService,
    promLogger: PromLogger,
    logger: Logger,
    private readonly config: Config,
    private readonly storage: Storage,
    private readonly repliedMessageCache: RepliedMessageCache,
    @Inject(BehaviorBase) private readonly behaviors: BehaviorBase[],
  ) {
    super(client, promLogger, logger);
  }
  
  /** Applies the behavior to the given client. */
  public async apply(): Promise<void> {
    let behaviorNames = this.behaviors.map(b => b.constructor.name);
    const registrationNotes: Record<string, unknown> = {};
    if (this.config.inLocalDiagnosticMode) {
      registrationNotes.LOCAL_DIAGNOSTIC_MODE = "ENABLED - Replies Disabled";
      behaviorNames = behaviorNames.map(b => ` DIAGNOSTIC MDOE - Replies Disabled - Check Console - [${b}]`)
    }
    registrationNotes.behaviorNames = behaviorNames;
    this.logger.trackSimpleEvent(LoggerCategory.BehaviorRegistration, `Registering Behavior: ${this.constructor.name}`, registrationNotes)
    await this.register();
  }

  /** Called on initialization to register any callbacks with the discord client. */
  

  protected async register() {
    this.client.on('messageCreate', async message => {
      // ignore bots to avoid loops
      if (message.author.bot) { return; }

      // ignore re-delivered messages
      if (this.repliedMessageCache.hasSeenMessageBefore(message, "adapter")) { return; }

      const context = await this.buildContext(message);

      await this.handleAll(message, context);
    });
  }

  private async buildContext(message: Message): Promise<BehaviorContext> {
    // console.log({event: 'buildContext-1', authorId: message.author.id, content: message.content, timestamp: new Date().toISOString()});
    let user: DatabaseFailure | User;
    try {
      user = await this.storage.getOrCreateUser(message.author.id);
    } catch (ex) {
      user = <DatabaseFailure>{ error: (ex as Error).message };
    }

    const whichParser = this.selectParser(message);
    const requiredPrefix = this.getPrefix(message);

    return {
      user: user,
      roleConfiguredOptions: {
        whichParser,
        requiredPrefix,
      },
      messageConfiguredOptions: {
        prefixStyle: PrefixStyle.Unknown,
      },
    };
  }

  /** Returns the processed content or null (if it should not be handled). */
  private async prepareMessage(message: Message, context: BehaviorContext): Promise<{ content: string, prefixStyle: PrefixStyle } | null> {
    let content = message.content;

    // ignore without prefix
    const match = content.match(this.config.mentionRegex);
    let strippedContent = content;
    if (match) {
      strippedContent = content.substring(match[0].length).trim();
    }

    // treat all DMs as pinged messages
    if (!message.guildId) {
      return { content: strippedContent, prefixStyle: PrefixStyle.DirectPing };
    }

    // if we are in a guild and pinged, pass that through
    if (!!match) {
      return { content: strippedContent, prefixStyle: PrefixStyle.DirectPing };
    }

    // if this guild has configured a required prefix
    if (context.roleConfiguredOptions.requiredPrefix) {
      const startsWithPrefix = strippedContent.startsWith(context.roleConfiguredOptions.requiredPrefix);

      if (!startsWithPrefix) {
        return { content: strippedContent, prefixStyle: PrefixStyle.Missing };
      } else {
        const finalContent = strippedContent.substr(context.roleConfiguredOptions.requiredPrefix.length).trim();
        return { content: finalContent, prefixStyle: PrefixStyle.ProvidedOrNotRequired };
      }
    }

    // otherwise assume we were not tagged in
    return { content: strippedContent, prefixStyle: PrefixStyle.ProvidedOrNotRequired };
  }

  private async handleAll(message: Message, context: BehaviorContext): Promise<void> {
    const preparedMessage = await this.prepareMessage(message, context);
    if (!preparedMessage) { return; }

    context.messageConfiguredOptions = { prefixStyle: preparedMessage.prefixStyle };

    // console.log({event: 'handleAll-1', context, preparedMessage});

    for (const behavior of this.behaviors) {
      let result: BehaviorResponse | null = null;
      switch (preparedMessage.prefixStyle) {
        case PrefixStyle.DirectPing:
          result = await behavior.onDirectPing(message, preparedMessage.content, context);
          break;
        case PrefixStyle.ProvidedOrNotRequired:
          result = await behavior.onPrefixProvidedOrNotRequired(message, preparedMessage.content, context);
          break;
        default:
        case PrefixStyle.Missing:
          result = await behavior.onPrefixMissing(message, preparedMessage.content, context);
          break;
      }

      // console.log({event: 'handleAll-2', label: behavior.label, context, preparedMessage, behavior, result});
      if (result) {
        this.handleReply(behavior, message, result);
      }
    }
  }

  private handleReply(behavior: BehaviorBase, message: Message<boolean>, result: BehaviorResponse) {
    if (!this.config.inLocalDiagnosticMode) {
      this.logger.trackMessageEvent(LoggerCategory.BehaviorEvent, `${behavior.label}`, message, { result });
      message.reply(result.response).catch(rejected => this.handleSendRejection(message));
    } else {
      this.logger.trackMessageEvent(LoggerCategory.BehaviorEvent, `[DIAGNOSTIC - REPLY NOT SENT] ${behavior.label}`, message, { result });
    }
  }

  private getRelevantRoleNames(message: Message, prefix: string): { rollemRoles: string[], authorRoles: string[] } {
    if (!message.guildId) {
      return {
        rollemRoles: [],
        authorRoles: [],
      };
    }

    const me = message.guild?.members.cache.get(this.client.user?.id || "0");
    const myRoleNames = me?.roles.cache.map(r => r.name) ?? [];
    const myRoles = myRoleNames.filter(rn => rn.startsWith(prefix));

    const author = message.guild?.members.cache.get(message.author?.id || "0");
    const authorRoleNames = author?.roles.cache.map(r => r.name) ?? [];
    const authorRoles = authorRoleNames.filter(rn => rn.startsWith(prefix));
    return {
      rollemRoles: myRoles,
      authorRoles: authorRoles,
    };
  }

  private getPrefix(message: Message) {
    const prefixRolePrefix = 'rollem:prefix:';
    const prefixRoles = this.getRelevantRoleNames(message, prefixRolePrefix);
    if (prefixRoles.rollemRoles.length === 0) { return ""; }
    const prefix = prefixRoles.rollemRoles[0].substring(prefixRolePrefix.length);
    return prefix;
  }

  /** Checks for the role 'rollem:v2' being applied to rollem. */
  private selectParser(message: Message): ParserVersion {
    const v1Role = 'rollem:v1';
    const v1BetaRole = 'rollem:beta';
    const v2Role = 'rollem:v2';

    // DMs never use the new parser. For now.
    if (!message.guild) { return 'v1'; }

    const v1Status = this.getRelevantRoleNames(message, v1Role);
    const betaStatus = this.getRelevantRoleNames(message, v1BetaRole);
    const v2Status = this.getRelevantRoleNames(message, v2Role);

    // prioritze user settings
    if (v1Status.authorRoles.length > 0) { return 'v1-beta'; }
    if (betaStatus.authorRoles.length > 0) { return 'v1-beta'; }
    if (v2Status.authorRoles.length > 0) { return 'v2'; }

    // then guild settings
    if (v1Status.rollemRoles.length > 0) { return 'v1-beta'; }
    if (betaStatus.rollemRoles.length > 0) { return 'v1-beta'; }
    if (v2Status.rollemRoles.length > 0) { return 'v2'; }

    // default to v1
    return 'v1';
  }
}