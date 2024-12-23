const path = require('path')
const { IgnorePlugin } = require('webpack');

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  target: 'node',
  node: {
    global: true,
    __filename: false,
    __dirname: false,
  },
  ignoreWarnings: [
    { message: /the request of a dependency is an expression/, }, // TypeORM spams these
    { message: /tried to access .*?\(a peer dependency\) but it isn't provided by its ancestors/ }, // Appears to be a Yarn Berry bug https://github.com/yarnpkg/berry/issues/5153
  ],
  plugins: [
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
    new IgnorePlugin({ resourceRegExp: /^supports-color$/}), // debug optional peer dependency?
  ],
  output: {
    path: path.resolve(__dirname, '../dist/umd'),
    filename: 'index.js',
    library: '@rollem/common',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.ts(x*)?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'config/tsconfig.umd.json',
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
}