import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: '.env.local' });

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

console.log("Config:", {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_BUCKET_NAME,
    SECRET: R2_SECRET_ACCESS_KEY ? "EXISTS" : "MISSING"
});

const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || "",
        secretAccessKey: R2_SECRET_ACCESS_KEY || "",
    },
});

async function test() {
    console.log("\n1. Testing ListObjects...");
    try {
        const data = await s3Client.send(new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            MaxKeys: 1
        }));
        console.log("SUCCESS: Can list objects in bucket.");
    } catch (e) {
        console.error("FAILED ListObjects:", e.message);
    }

    console.log("\n2. Testing Upload...");
    try {
        const res = await s3Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: "test-connection.txt",
            Body: "Hello R2!",
            ContentType: "text/plain"
        }));
        console.log("SUCCESS: Uploaded test-connection.txt");
    } catch (e) {
        console.error("FAILED Upload:", e.message);
        console.error("Full Error:", e);
    }
}

test();
