####################################################################################################
# Source: https://nextjs.org/docs/pages/building-your-application/deploying#docker-image
# -> https://github.com/vercel/next.js/tree/v14.2.13/examples/with-docker
# -> https://github.com/vercel/next.js/blob/v14.2.13/examples/with-docker/Dockerfile
#
# Referenced:
# - https://docs.docker.com/build/concepts/context/#dockerignore-files
# - https://stackoverflow.com/questions/74456545/i-am-getting-error-while-converting-yarn-berry-nextjs-project-to-standalone
# - https://dev.to/siddharthvenkatesh/docker-setup-for-yarn-workspaces-4pnj
# - https://github.com/vercel/next.js/discussions/33567
# - https://xfor.medium.com/yarn-workspaces-and-docker-39e30402b69b
# - https://docs.docker.com/build/building/multi-stage/
# - https://stackoverflow.com/questions/49754286/multiple-images-one-dockerfile
# - https://github.com/yarnpkg/berry/issues/1956
# - https://gitlab.com/Larry1123/yarn-contrib/-/tree/master/packages/plugin-production-install
# - https://ismayilkhayredinov.medium.com/orchestrating-and-dockerizing-a-monorepo-with-yarn-3-and-turborepo-e26241a285cb
# - https://github.com/vercel/next.js/issues/36386
# - https://depot.dev/docs/languages/node-pnpm-dockerfile
# - https://www.reddit.com/r/typescript/comments/1ainj58/pnpm_vs_yarn_v4/
# - https://gist.github.com/vanxh/0c3a62cc6bd6b8aa143c2e278d9e9dfa

####################################################################################################
# Notes on running
# - must be run from root dir ie `docker build -f Dockerfile --label='rollem-ui' -t rollem-ui ../..`
####################################################################################################

####################################################################################################
# Variables
####################################################################################################
# BUILD_STYLE="single" == use single-target builds; targeting `rollem-discord` only builds required deps
# BUILD_STYLE="global" == use global builds; targeting `rollem-discord` will also build `ui` and `mastodon`
ARG BUILD_STYLE="single"
# ARG BUILD_STYLE="global"
####################################################################################################

####################################################################################################
# base: Base Image Alias
  FROM node:18-alpine AS base

  # All the sub-images require yarn berry
  RUN corepack enable
  RUN yarn set version berry
  RUN yarn --version
####################################################################################################

####################################################################################################
# workspace.deps.precursor: Copy only the package files to avoid busting the dep cache when unnecessary
# see https://stackoverflow.com/questions/49939960/docker-copy-files-using-glob-pattern
  FROM base AS workspace.deps.precursor
  WORKDIR /app

  # Copy yarn support files (see https://gist.github.com/vanxh/0c3a62cc6bd6b8aa143c2e278d9e9dfa)
  COPY .yarn/ ./.yarn
  # COPY package.json .pnp.cjs .yarnrc.yml yarn.lock* ./
  # .pnp.cjs is intentionally excluded as its inclusion causes errors in the CI/CD pipeline
  COPY package.json .yarnrc.yml yarn.lock* ./

  # Copy all packages (this will alwways break the cache, but should be fast)
  COPY packages/ packages/
  COPY resources/ resources/

  # remove any file that is not like /app/**/package.json
  RUN find packages \! -name "package.json" -mindepth 2 -maxdepth 2 -print | xargs rm -rf
####################################################################################################

####################################################################################################
# workspace.deps: Preps the entire workspace's dependencies
  FROM base AS workspace.deps

  # Tree is a useful inspection tool
  RUN apk add --no-cache tree

  # Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
  RUN apk add --no-cache libc6-compat
  WORKDIR /app

  # Copying necessary Yarn Workspace packages
  COPY --from=workspace.deps.precursor /app/ .

  # Install packages
  RUN yarn --version
  RUN yarn install --immutable
####################################################################################################

####################################################################################################
####################################################################################################
# Builders
####################################################################################################
####################################################################################################

####################################################################################################
# rollem-common.build: Builds ONLY @rollem/common -- the common package
  FROM workspace.deps AS rollem-common.build
  COPY packages/common /app/packages/common
  RUN yarn common run build
####################################################################################################

####################################################################################################
# rollem-language.build: Builds ONLY @rollem/language -- the language package
  FROM workspace.deps AS rollem-language.build
  COPY --from=rollem-common.build /app/packages/common/dist /app/packages/common/dist
  COPY packages/language /app/packages/language
  RUN yarn language run build
####################################################################################################

####################################################################################################
# rollem-discord.build: Builds ONLY @rollem/bot -- the Discord bot
  FROM workspace.deps AS rollem-discord.build
  COPY --from=rollem-common.build /app/packages/common/dist /app/packages/common/dist
  COPY --from=rollem-language.build /app/packages/language/dist /app/packages/language/dist
  COPY packages/bot /app/packages/bot
  RUN yarn bot run build
####################################################################################################

####################################################################################################
# rollem-mastodon.build: Builds ONLY @rollem/mastodon -- the Mastodon bot
  FROM workspace.deps AS rollem-mastodon.build
  COPY --from=rollem-common.build /app/packages/common/dist /app/packages/common/dist
  COPY --from=rollem-language.build /app/packages/language/dist /app/packages/language/dist
  COPY packages/mastodon /app/packages/mastodon
  RUN yarn mastodon run build
####################################################################################################

####################################################################################################
# rollem-ui.build: Builds ONLY @rollem/ui -- the website
  FROM workspace.deps AS rollem-ui.build
  COPY --from=rollem-common.build /app/packages/common/dist /app/packages/common/dist
  COPY --from=rollem-language.build /app/packages/language/dist /app/packages/language/dist
  COPY packages/ui /app/packages/ui
  RUN yarn ui run build
####################################################################################################

####################################################################################################
# workspace.build: Builds everything
  FROM workspace.deps AS workspace.build
  COPY packages /app/packages
  RUN yarn run build
####################################################################################################

####################################################################################################
####################################################################################################
# Wiring for combined-build switching
# See https://stackoverflow.com/questions/43654656/dockerfile-if-else-condition-with-external-arguments
# The goal here is to have good cache behavior for both local dev and CI/CD publishing
# - For local dev, use the default `--build-arg BUILD_STYLE=single` to only build the required package chain
# - For packaging all three, use `--build-arg BUILD_STYLE=global` to build everything and cache that layer
  FROM workspace.build AS rollem-discord.global.build
  FROM rollem-discord.build AS rollem-discord.single.build
  FROM rollem-discord.${BUILD_STYLE}.build AS rollem-discord.switched.build

  FROM workspace.build AS rollem-mastodon.global.build
  FROM rollem-mastodon.build AS rollem-mastodon.single.build
  FROM rollem-mastodon.${BUILD_STYLE}.build AS rollem-mastodon.switched.build

  FROM workspace.build AS rollem-ui.global.build
  FROM rollem-ui.build AS rollem-ui.single.build
  FROM rollem-ui.${BUILD_STYLE}.build AS rollem-ui.switched.build
####################################################################################################
####################################################################################################

####################################################################################################
####################################################################################################
# Terminal Packages
####################################################################################################
####################################################################################################

####################################################################################################
# rollem-discord: Minimal container to run the discord bot
  FROM base AS rollem-discord

  # We'll be setting this up as a clone of our workspace, with /app/packages/specific-package containing what we need
  WORKDIR /app

  # Labeling ( see https://github.com/opencontainers/image-spec/blob/main/annotations.md )
  LABEL "org.opencontainers.image.title"="Rollem Discord Bot"
  LABEL "org.opencontainers.image.ref.name"="rollem/discord"
  LABEL "org.opencontainers.image.url"="https://rollem.rocks"
  LABEL "org.opencontainers.image.documentation"="https://github.com/rollem-discord/rollem-discord"
  LABEL "org.opencontainers.image.source"="https://github.com/rollem-discord/rollem-discord"

  # Copying necessary Yarn Workspace packages
  COPY --from=rollem-discord.switched.build /app/.yarn ./.yarn
  COPY --from=rollem-discord.switched.build /app/package.json /app/.pnp.cjs /app/.yarnrc.yml /app/yarn.lock* ./
  
  # Copying necessary Yarn Workspace packages
  COPY --from=rollem-discord.switched.build /app/packages /app/packages

  WORKDIR /app/packages/bot

  # Env setup
  ARG NODE_ENV
  ENV NODE_ENV="$NODE_ENV"
  EXPOSE 8080

  # Context dump
  RUN yarn --version

  # Execution
  CMD yarn run container:start
####################################################################################################

####################################################################################################
# Minimal container to run the mastodon bot
  FROM base AS rollem-mastodon

  # We'll be setting this up as a clone of our workspace, with /app/packages/specific-package containing what we need
  WORKDIR /app

  # https://github.com/opencontainers/image-spec/blob/main/annotations.md
  LABEL "org.opencontainers.image.title"="Rollem Mastodon Bot"
  LABEL "org.opencontainers.image.ref.name"="rollem/mastodon"
  LABEL "org.opencontainers.image.url"="https://rollem.rocks"
  LABEL "org.opencontainers.image.documentation"="https://github.com/rollem-discord/rollem-discord"
  LABEL "org.opencontainers.image.source"="https://github.com/rollem-discord/rollem-discord"

  # ONBUILD
  ARG NODE_ENV
  ENV NODE_ENV="$NODE_ENV"

  # Copying necessary Yarn Workspace packages
  COPY --from=rollem-mastodon.switched.build /app/.yarn ./.yarn
  COPY --from=rollem-mastodon.switched.build /app/package.json /app/.pnp.cjs /app/.yarnrc.yml /app/yarn.lock* ./
  
  # Copying necessary Yarn Workspace packages
  COPY --from=rollem-mastodon.switched.build /app/packages /app/packages

  WORKDIR /app/packages/mastodon

  EXPOSE 8080

  CMD yarn run container:start
####################################################################################################

####################################################################################################
# Minimal container to run the ui
  FROM base AS rollem-ui

  # We'll be setting this up as a clone of our workspace, with /app/packages/specific-package containing what we need
  WORKDIR /app

  # https://github.com/opencontainers/image-spec/blob/main/annotations.md
  LABEL "org.opencontainers.image.title"="Rollem UI"
  LABEL "org.opencontainers.image.ref.name"="rollem/ui"
  LABEL "org.opencontainers.image.url"="https://rollem.rocks"
  LABEL "org.opencontainers.image.documentation"="https://github.com/rollem-discord/rollem-discord"
  LABEL "org.opencontainers.image.source"="https://github.com/rollem-discord/rollem-discord"

  # Copying necessary Yarn Workspace packages
  COPY --from=rollem-ui.switched.build /app/.yarn ./.yarn
  COPY --from=rollem-ui.switched.build /app/package.json /app/.pnp.cjs /app/.yarnrc.yml /app/yarn.lock* ./
  
  # Copying necessary Yarn Workspace packages
  COPY --from=rollem-ui.switched.build /app/packages /app/packages

  WORKDIR /app/packages/ui
  
  # Env setup
  EXPOSE 3000
  ENV PORT=3000
  ENV HOSTNAME="0.0.0.0"
  
  CMD yarn start
####################################################################################################
