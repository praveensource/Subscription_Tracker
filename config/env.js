import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

const { PORT, NODE_ENV = 'development', DB_URI, JWT_SECRET, JWT_EXPIRES_IN, ARCJET_KEY, ARCJET_ENV, QSTASH_URL, QSTASH_TOKEN, EMAIL_USER, EMAIL_PASS, SERVER_URL } = process.env;

if (!PORT) {
    throw new Error('PORT environment variable is required');
}

export { PORT, NODE_ENV, DB_URI, JWT_SECRET, JWT_EXPIRES_IN, ARCJET_KEY, ARCJET_ENV, QSTASH_URL, QSTASH_TOKEN, EMAIL_USER, EMAIL_PASS, SERVER_URL };