const { IgnorePlugin } = require('webpack');
const nodeExternals = require('webpack-node-externals');
const path = require('path');

const config = {
  entry: './src/discord/rollem-bot/bot.ts',
  target: 'node',
  externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
  ignoreWarnings: [
    { message: /the request of a dependency is an expression/, }, // TypeORM spams these
    { message: /supports-color.*?a peer dependency/ }, // I blame TypeORM 
    { message: /tried to access .*?\(a peer dependency\) but it isn't provided by its ancestors/ }, // Appears to be a Yarn Berry bug https://github.com/yarnpkg/berry/issues/5153
  ],
  plugins: [
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
    new IgnorePlugin({ resourceRegExp: /^applicationinsights-native-metrics$/ }), // ???
  ],
  node: {
    global: true,
    __filename: false,
    __dirname: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.pegjs$/,
        use: "pegjs-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".pegjs"],
    alias: {
      "@bot": path.resolve(__dirname, "src/discord/rollem-bot/"),
      "@common": path.resolve(__dirname, "src/common/"),
    },
  },
  devtool: 'cheap-module-source-map',
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
  },
};

// if (process.env.NODE_ENV !== 'production') {
//   config.plugins.push(new WebpackShellPluginNext({
//     onBuildStart:{
//       scripts: ['echo "Webpack Start"'],
//     },
//     onDoneWatch: {
//       scripts: ['yarn run webpack:launch'],
//       blocking: false,
//     }
//   }));
// }

module.exports = config;