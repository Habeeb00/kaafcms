import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs/promises';
import path from 'path';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_DEV_DOMAIN = process.env.R2_PUBLIC_DEV_DOMAIN;

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Deletes a file from R2 or local storage based on its URL.
 * @param url The public URL of the file.
 */
export async function deleteFileByUrl(url: string | null | undefined) {
  if (!url) return;
  
  // Skip hardcoded default avatars or static assets that aren't in uploads/assets
  if (url === '/user.jpg' || (!url.includes('/assets/') && !url.includes('/uploads/') && !url.includes(R2_PUBLIC_DEV_DOMAIN || 'r2.dev'))) {
    console.log(`Skipping deletion for non-managed asset: ${url}`);
    return;
  }

  const isR2 = R2_PUBLIC_DEV_DOMAIN && url.includes(R2_PUBLIC_DEV_DOMAIN);

  try {
    if (isR2) {
      // Extract the key from the URL
      // Example: https://pub-...r2.dev/assets/blogs/test/image.jpg -> assets/blogs/test/image.jpg
      const urlParts = url.split(`${R2_PUBLIC_DEV_DOMAIN}.r2.dev/`);
      const key = urlParts.length > 1 ? urlParts[1] : url.split(`${R2_PUBLIC_DEV_DOMAIN}.dev/`)[1];
      
      if (key) {
        console.log(`Deleting from R2: ${key}`);
        await s3Client.send(new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
        }));
      }
    } else {
      // Local file
      // URL is likely /assets/... or /uploads/...
      // Main site public folder is 1 level up from admin-dashboard root in development
      const relativePath = url.startsWith('/') ? url.substring(1) : url;
      const absolutePath = path.join(process.cwd(), '..', 'public', relativePath);
      
      try {
        await fs.access(absolutePath);
        console.log(`Deleting local file: ${absolutePath}`);
        await fs.unlink(absolutePath);
      } catch (err) {
        console.warn(`Local file not found for deletion: ${absolutePath}`);
      }
    }
  } catch (error) {
    console.error(`Failed to delete file ${url}:`, error);
  }
}
