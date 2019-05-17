declare namespace NodeJS {
  export interface ProcessEnv {
    ADMINS : string,
    PREFIX : string,
    CODENAME : string,
    DISCORD_TOKEN : string,
    EMBED_COLOR :string,
    DATABASE_URI: string,
    NODE_ENV: "development" | "production",
    PROCESS_GUILDSPERSHARDS: string,
    PROCESS_SHARDS: string,
    PROCESS_CUSTERS: string,
    LOVE_COOOLDOWN: string,
    DAILY_COINS: string,
    DAILY_COOLDOWN: string
  }
}