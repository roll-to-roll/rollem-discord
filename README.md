[![Docker (Tag)](https://github.com/rollem-discord/rollem-discord/actions/workflows/tag--docker-build.yml/badge.svg)](https://github.com/rollem-discord/rollem-discord/actions/workflows/tag--docker-build.yml)
[![Docker (PR)](https://github.com/rollem-discord/rollem-discord/actions/workflows/pr--docker-build.yml/badge.svg)](https://github.com/rollem-discord/rollem-discord/actions/workflows/pr--docker-build.yml)
[![Docker (Commit)](https://github.com/rollem-discord/rollem-discord/actions/workflows/commit--docker-build.yml/badge.svg)](https://github.com/rollem-discord/rollem-discord/actions/workflows/commit--docker-build.yml)
[![CI Syntax](https://github.com/rollem-discord/rollem-discord/actions/workflows/ci-syntax.yml/badge.svg)](https://github.com/rollem-discord/rollem-discord/actions/workflows/ci-syntax.yml)

Useful Links (for users):  
[Website](https://rollem.rocks)
| [User Guide](https://rollem.rocks/docs)
| [Changelog](/packages/bot/CHANGELOG.md)
| [Get Help (Discord)](https://discord.gg/VhYX9u7)

Add Rollem to your Discord Server (for server admins):  
[Primary Bot](https://rollem.rocks/invite/)
| [Beta Bot](https://rollem.rocks/invite/next/)

# Rollem Bot (for Discord)
A feature-filled dicebot that allows you to just roll. Rollem parses chat messages, and if it looks like a dice roll (`d20 to hit`), Rollem assumes it is, and produces a result. Messages can also be `rolled [d20 inline] with [2d4 multiple rolls]` or `6#4d6kh3 in bulk`.

Read more about available commands & syntax [on the website](https://rollem.rocks/docs).

## Primary Channel (`@rollem` | [invite](https://rollem.rocks/invite/))
The primary bot. If you aren't sure which to add, invite this one.

Changes are vetted in the Beta Channel before moving to this bot, so you should be insulated from change-related downtime.

## Beta Channel (`@rollem-next` | [invite](https://rollem.rocks/invite/next/))
The secondary bot, with earlier feature updates. Changes are vetted in the Beta Channel before being moved to the Primary Channel.

You may have both `@rollem-next` and `@rollem` in the same server, but they should not be allowed in the same channels.

---

# Running Locally (via Docker Desktop)
If you aren't planning to make changes locally, Docker will be the easier way to run the project.
## Dependency setup
### Windows / Scoop
1. Get required tools
   1. Scoop ([follow instructions](https://scoop.sh/))
   2. Git + CLI `scoop install git-with-openssh`
   3. Local Docker [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
2. Get optional tools
   1. Many linux utils `scoop install busybox`
   2. Decent tree command `scoop install main/tre-command`
3. Clone project `git clone https://github.com/rollem-discord/rollem-discord`
4. Any other commands I list assume you are running from the project root with Git Bash  
   (I do this via [VSCode](https://code.visualstudio.com/))

### The Hard Way
1. Clone Project
   1. Get [Git](https://git-scm.com/downloads)
   2. Clone project `git clone https://github.com/rollem-discord/rollem-discord`
   3. Any other commands I list assume you are running from the project root with Git Bash  
      (I do this via [VSCode](https://code.visualstudio.com/))
2. Install local Docker
   1. I used [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)

## Secret Setup
All secrets are stored in `/secrets/docker.env` or `/secrets/vscode.env`.  
Sample files can be found in `/secrets/*.sample.env`.  
Copy this file to `/secrets/*.env` (ie `/secrets/docker.sample.env` -> `/secrets/docker.env`) and make changes.
> `/secrets/docker.env` is used for `compose.yaml` with Docker Compose.  
> `/secrets/vscode.env` is used for local development.

You will need values from your own Discord App registration.  
Go to [Discord Developer Portal - My Applications](https://discord.com/developers/applications) to create one if needed.

Values to modify in `/secrets/docker.env`:
- `DISCORD_CLIENT_ID`: (Your Application) -> OAuth2 -> Client ID
- `DISCORD_CLIENT_SECRET`: (Your Application) -> OAuth2 -> Client Secret (Reset Secret)
- `DISCORD_BOT_USER_TOKEN`: (Your Application) -> Bot -> Token (Reset Token)
- The other fields can be ignored.

## Running the bot (locally, via [docker packages](https://hub.docker.com/u/rollem))
1. `docker compose up` - pulls packages and begins launch process
2. Eventually it will say something like `Starting... Ready in 2.1s`  
   If everything has gone to plan...
   1. The bot should appear online.
   2. The website should be accessible at http://localhost:3000
   3. The website Login button should work
   4. You should have a new folder `/database/`
3. When done, stop `docker compose` with...
   1. press `Ctrl+C`
   2. ...wait for Stopped... 
   3. press `Ctrl+C` again
4. Cleanup...
   1. Docker will keep all your pulled images and containers around.
   2. Delete them to free up space in Docker For Windows GUI or otherwise.

---

# Development
If you wish to make changes to Rollem, you will need a few more tools than above.

## Dependencies
1. Clone Project
   1. Get [Git](https://git-scm.com/downloads)
   2. Clone project `git clone https://github.com/rollem-discord/rollem-discord`
   3. Any other commands I list assume you are running from the project root with Git Bash  
      (I do this via [VSCode](https://code.visualstudio.com/))
2. Install Node.js
   1. Follow the [official node.js instructions](https://nodejs.org/en/download/package-manager). I used the instructions for `22 LTS` on Windows using `fnm`
   2. Rollem currently uses Node 18, but may work on later versions.  
      Check [the Dockerfile](./workspace.Dockerfile) to verify the latest version Rollem targets.  
      You're looking for this line: `FROM node:18-alpine AS base`
   3. Use `fnm use --install-if-missing 18` if needed
3. Setup Yarn Modern ([instructions](https://yarnpkg.com/getting-started/install))
   1. `corepack enable` Initialize Yarn
   2. `yarn` Install Packages
4. Install local Docker
   1. I used [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)

## Build Docker Packages
### Package and run Discord Bot via Docker
1. `yarn bot package` -- build + package
2. `yarn bot package:start` -- start the package  
   If there is an issue, `yarn bot package:debug` gives a shell in the container.
3. Bot should appear online and respond to messages
4. `yarn bot package:cleanup` Delete image when done

### Package and run UI via Docker
1. `yarn ui package` -- build + package
2. `yarn ui package:start` -- start the package  
   If there is an issue, `yarn ui package:debug` gives a shell in the container.
3. Visit http://localhost:3000
4. `yarn ui package:cleanup` Delete image when done  

---

# Deployment
TODO: Overview of packaging + deployment process

---

# Libraries
Rollem's engine is packaged as a library that can be used in other projects.

TODO: Instructions on how to do this. Sample project.