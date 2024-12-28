const path = require('path');

// references:
// - pg-native failure https://github.com/netlify/next-on-netlify/issues/33
// - nextjs TS module import https://github.com/vercel/next.js/issues/9474

module.exports = {
  async redirects() {
    return [
      {
        source: '/invite',
        destination: 'https://discordapp.com/oauth2/authorize?client_id=240732567744151553&scope=bot&permissions=103079282688',
        permanent: false,
      },
      {
        source: '/invite/next',
        destination: 'https://discordapp.com/oauth2/authorize?client_id=840409146738475028&scope=bot&permissions=103079282688',
        permanent: false,
      },
      {
        source: '/app-directory',
        destination: 'https://discord.com/application-directory/240732567744151553',
        permanent: false,
      },
      {
        source: '/app-directory/next',
        destination: 'https://discord.com/application-directory/840409146738475028',
        permanent: false,
      },
      {
        source: '/get-support',
        destination: 'https://discord.gg/VhYX9u7',
        permanent: false,
      },
    ];
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Note: webpack is provided, so we do not need to `require` it
    const IgnorePlugin = webpack.IgnorePlugin;

    config.ignoreWarnings = config.ignoreWarnings || [];
    config.ignoreWarnings.push(
      { message: /the request of a dependency is an expression/, }, // TypeORM spams these
      { message: /supports-color.*?a peer dependency/ }, // I blame TypeORM 
      { message: /tried to access .*?\(a peer dependency\) but it isn't provided by its ancestors/ }, // Appears to be a Yarn Berry bug https://github.com/yarnpkg/berry/issues/5153
    );

    // Do not include .native which tries to load pg-native
    // See: https://github.com/sequelize/sequelize/issues/3781#issuecomment-537979334
    config.plugins.push(
      // TODO: I'm not sure why all these are showing up here, since I thought they'd be already excluded from the dependencies list by the bundling?
      new IgnorePlugin({ resourceRegExp: /^pg-native$/}), // typeorm peer dependency
      new IgnorePlugin({ resourceRegExp: /^react-native-sqlite-storage$/}), // typeorm peer dependency
      new IgnorePlugin({ resourceRegExp: /^mysql$/}), // typeorm peer dependency
      new IgnorePlugin({ resourceRegExp: /^mssql$/}), // typeorm peer dependency
      new IgnorePlugin({ resourceRegExp: /^sql.js$/}), // typeorm peer dependency
      new IgnorePlugin({ resourceRegExp: /^sqlite3$/}), // typeorm peer dependency
      new IgnorePlugin({ resourceRegExp: /^better-sqlite3$/}), // typeorm peer dependency
      new IgnorePlugin({ resourceRegExp: /^ioredis$/}), // typeorm peer dependency
      new IgnorePlugin({ resourceRegExp: /^redis$/}), // typeorm peer dependency
      new IgnorePlugin({ resourceRegExp: /^typeorm-aurora-data-api-driver$/}), // typeorm peer dependency
      new IgnorePlugin({ resourceRegExp: /^redis$/}), // typeorm peer dependency
      new IgnorePlugin({ resourceRegExp: /^pg-query-stream$/}), // typeorm peer dependency
      new IgnorePlugin({ resourceRegExp: /^oracledb$/}), // typeorm peer dependency
      new IgnorePlugin({ resourceRegExp: /^mysql2$/}), // typeorm peer dependency
      new IgnorePlugin({ resourceRegExp: /^hdb-pool$/}), // typeorm peer dependency
      new IgnorePlugin({ resourceRegExp: /^@sap\/hana-client$/}), // typeorm peer dependency
      new IgnorePlugin({ resourceRegExp: /^mongodb$/}), // typeorm peer dependency
      new IgnorePlugin({ resourceRegExp: /^@google-cloud\/spanner$/}), // typeorm peer dependency
      new IgnorePlugin({ resourceRegExp: /^zlib-sync$/ }), // discord-ws dependency
      new IgnorePlugin({ resourceRegExp: /^stack-chain$/, contextRegExp: /cls-hooked/ }), // cls-hooked dependency
      new IgnorePlugin({ resourceRegExp: /^bufferutil$/ }), // ws peer dependency
      new IgnorePlugin({ resourceRegExp: /^utf-8-validate$/ }), // ws peer dependency
      new IgnorePlugin({ resourceRegExp: /^@azure\/opentelemetry-instrumentation-azure-sdk$/ }), // ws peer dependency
      new IgnorePlugin({ resourceRegExp: /^@opentelemetry\/instrumentation$/ }), // ???
      new IgnorePlugin({ resourceRegExp: /^@opentelemetry\/api$/ }), // ???
      new IgnorePlugin({ resourceRegExp: /^@opentelemetry\/sdk-trace-base$/ }), // ???
      new IgnorePlugin({ resourceRegExp: /^@azure\/functions-core$/ }), // ???
    );

    // console.log(defaultLoaders);
    config.module.rules.push({
      test: /\.tsx?$/,
      use: ["ts-loader"],
    })
    // config.module.rules.push({
    //   test: /\.tsx?|\.ts?$/,
    //   use: [defaultLoaders.type],
    // });

    // config.resolve.alias = config.alias || {};
    // config.resolve.alias['pg-native'] = path.join(__dirname, 'aliases/pg-native.js');

    // Important: return the modified config
    return config
  },
  experimental: {
    // Need to disable minification for TypeORM
    // See https://github.com/typeorm/typeorm/issues/4714
    // See https://github.com/vercel/next.js/issues/59594
    // See https://github.com/vercel/next.js/discussions/58182
    serverMinification: false,
  },

  // Standalone required for docker deploy?
  // Source: https://nextjs.org/docs/pages/building-your-application/deploying#docker-image
  // -> https://github.com/vercel/next.js/tree/v14.2.13/examples/with-docker
  // TODO: Didn't work for me. Trying without.
  // output: "standalone",
};