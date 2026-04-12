import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || 'fba52c6184846230dbdeb74912d38b6c',
    databaseId: 'ccbd8ad8-7ba3-4288-975e-ba09b8f0c499',
    token: process.env.CLOUDFLARE_D1_TOKEN || '',
  },
});
