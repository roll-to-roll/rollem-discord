import { User, UserFlags, UserSiteData } from ".";
import dotenv from "dotenv";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

/** The default connection optionst. Partially configured by environment. */
export const connectionOptions: PostgresConnectionOptions = {
  type: "postgres",
  url: process.env.DB_CONNECTION_STRING,
  ssl: process.env.DB_DISABLE_SSL ? false : { rejectUnauthorized: false },
  synchronize: false,
  logging: (process.env.DB_ENABLE_LOGGING ?? "false").toLowerCase() === "true",
  entities: [User, UserFlags, UserSiteData],
  migrations: ["src/storage/migrations/**/*.ts"],
  subscribers: ["src/storage/subscriber/**/*.ts"],
  
  // this seems to have been removed https://github.com/typeorm/typeorm/issues/8905
  // Seems to be time to switch off of TypeORM. Perhaps to Prisma? There are several options tho.
  // https://www.reddit.com/r/node/comments/q9kwew/why_is_typeorm_hated_so_much/
  // cli: {
  //   migrationsDir: "src/storage/migrations",
  // },
};