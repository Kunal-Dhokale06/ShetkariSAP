import process from "node:process";

export type EnvironmentName = "development" | "production" | "test";

export interface AppEnv {
  NODE_ENV: EnvironmentName;
  PORT: number;
  API_PREFIX: string;
  CORS_ORIGIN: string;
  AUTH_SECRET: string;
}

const defaultEnv: AppEnv = {
  NODE_ENV: "development",
  PORT: 3000,
  API_PREFIX: "/api",
  CORS_ORIGIN: "*",
  AUTH_SECRET: "dev-only-secret-change-me",
};

function parsePort(rawValue: string | undefined): number {
  if (!rawValue) {
    return defaultEnv.PORT;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid PORT value: ${rawValue}`);
  }

  return parsed;
}

function parseNodeEnv(rawValue: string | undefined): EnvironmentName {
  if (rawValue === "production" || rawValue === "test") {
    return rawValue;
  }

  return "development";
}

function loadAppEnv(): AppEnv {
  const env = process.env;

  return {
    NODE_ENV: parseNodeEnv(env.NODE_ENV),
    PORT: parsePort(env.PORT),
    API_PREFIX: env.API_PREFIX ?? defaultEnv.API_PREFIX,
    CORS_ORIGIN: env.CORS_ORIGIN ?? defaultEnv.CORS_ORIGIN,
    AUTH_SECRET: env.AUTH_SECRET ?? defaultEnv.AUTH_SECRET,
  };
}

export const env = loadAppEnv();
