import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

// Load env vars from .env.local (development) or process env in production
dotenv.config({ path: ".env.local" });

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error("Missing one or more R2 environment variables. Check R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME.");
  process.exit(1);
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const backupRoot = path.join(process.cwd(), "r2-backup");

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

async function uploadFile(fullPath) {
  const relativeKey = path.relative(backupRoot, fullPath).replace(/\\/g, "/");
  const body = await fs.readFile(fullPath);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: relativeKey,
      Body: body,
    })
  );

  console.log(`Uploaded: ${relativeKey}`);
}

async function run() {
  console.log("Starting R2 restore...");
  console.log(`Bucket: ${R2_BUCKET_NAME}`);
  console.log(`Account: ${R2_ACCOUNT_ID}`);

  try {
    await fs.access(backupRoot);
  } catch {
    console.error("r2-backup/ folder not found. Run r2-backup.mjs first.");
    process.exit(1);
  }

  let total = 0;

  try {
    for await (const filePath of walk(backupRoot)) {
      await uploadFile(filePath);
      total += 1;
    }

    console.log(`\nR2 restore complete. Uploaded ${total} object(s) from r2-backup/`);
  } catch (err) {
    console.error("R2 restore failed:", err);
    process.exit(1);
  }
}

run();
