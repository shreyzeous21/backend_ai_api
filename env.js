import dotenv from "dotenv";
dotenv.config();

function getEnv(name, { required = false } = {}) {
  const value = process.env[name];

  if (required && !value) {
    // throw new Error(`Missing Required Environment Variable: ${name}`);
    console.log(`Missing Required Environment Variable: ${name}`);
    return null;
  }

  return value ?? null;
}

export const ENV = Object.freeze({
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT) || 4000,

  AI: {
    OPENROUTER: {
      API_KEY: getEnv("OPENROUTER_API_KEY"),
    },

    GEMINI: {
      API_KEY: getEnv("GEMINI_API_KEY"),
    },
  },
});
