import fs from 'fs';
import util from 'util';
import { Logger, LoggerCategory } from './logger';
import { Injectable } from 'injection-js';
import packageInfo from '../../../../package.json';

const CHANGELOG_LINK = "<https://github.com/rollem-discord/rollem-discord/blob/master/packages/bot/CHANGELOG.md>\n\n";
const INITIAL_CHANGELOG = CHANGELOG_LINK + "(Sorry, we're still reading it from disk.)";
const INITIAL_VERSION = `v${packageInfo.version}`;

/** Loads and stores the changelog/version. */
@Injectable()
export class ChangeLog {
  /** The current version number. */
  public version: string = INITIAL_VERSION;

  /** The current changelog. */
  public changelog: string = INITIAL_CHANGELOG;

  constructor(private readonly logger: Logger) { }

  /**
   * Reads the changelog from disk and updates the version and changelog accordingly.
   * @returns itself
   */
  public async initialize(): Promise<ChangeLog> {
    const MAX_LENGTH = 2000 - CHANGELOG_LINK.length;
    const MAX_LINES = 15;

    try {
      const data = await util.promisify(fs.readFile)("./CHANGELOG.md", 'utf8');

      // add the version
      const newData = `# **${packageInfo.version}**\n${data}`;

      // don't go over the max discord message length
      const maxLengthChangelog = newData.substring(0, MAX_LENGTH);

      // don't go over a reasonable number of lines
      const reasonableLengthChangeLog = maxLengthChangelog.split("\n").slice(0, MAX_LINES).join("\n");

      // don't show partial sections
      const lastSectionIndex = reasonableLengthChangeLog.lastIndexOf("\n#");
      const noPartialSectionsChangeLog = reasonableLengthChangeLog.substring(0, lastSectionIndex);

      // set the changelog
      this.changelog = CHANGELOG_LINK + noPartialSectionsChangeLog

    } catch (err: any) {
      this.logger.trackError(LoggerCategory.BehaviorEvent, err);
      this.changelog = CHANGELOG_LINK + "(Sorry, there was an issue reading the file fom disk.) \n\n" + err;
    }

    return this;
  }
}