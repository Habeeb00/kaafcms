import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import fs from "fs";
import fsPromises from "fs/promises";
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

async function ensureDir(dirPath) {
  await fsPromises.mkdir(dirPath, { recursive: true });
}

async function downloadObject(key) {
  const outPath = path.join(backupRoot, key);
  await ensureDir(path.dirname(outPath));

  const result = await s3Client.send(
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );

  const bodyStream = result.Body;

  await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(outPath);
    bodyStream.pipe(writeStream);
    bodyStream.on("error", reject);
    writeStream.on("error", reject);
    writeStream.on("finish", resolve);
  });

  console.log(`Downloaded: ${key}`);
}

async function run() {
  console.log("Starting R2 backup...");
  console.log(`Bucket: ${R2_BUCKET_NAME}`);
  console.log(`Account: ${R2_ACCOUNT_ID}`);
  await ensureDir(backupRoot);

  let continuationToken = undefined;
  let total = 0;

  try {
    do {
      const res = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: R2_BUCKET_NAME,
          ContinuationToken: continuationToken,
        })
      );

      const contents = res.Contents || [];
      for (const obj of contents) {
        const key = obj.Key;
        if (!key || key.endsWith("/")) continue; // skip folder placeholders
        await downloadObject(key);
        total += 1;
      }

      continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (continuationToken);

    console.log(`\nR2 backup complete. Downloaded ${total} object(s) into r2-backup/`);
  } catch (err) {
    console.error("R2 backup failed:", err);
    process.exit(1);
  }
}

run();
