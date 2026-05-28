namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: "development" | "production" | "test";

    readonly DATABASE_URL: string;

    readonly GOOGLE_ID: string;
    readonly GOOGLE_SECRET: string;

    readonly GITHUB_ID: string;
    readonly GITHUB_SECRET: string;

    readonly TWITTER_ID: string;
    readonly TWITTER_SECRET: string;

    readonly FACEBOOK_ID: string;
    readonly FACEBOOK_SECRET: string;

    readonly ADMIN_EMAIL: string;
  }
}
