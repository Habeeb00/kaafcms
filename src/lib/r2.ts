import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Check if credentials are provided for Cloudflare R2
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

export async function generateUploadUrl(contentType: string, prefix: string = "uploads") {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error("Missing Cloudflare R2 environment variables. Please check your .env.local file.");
  }

  const fileId = uuidv4();
  // Provide an extension based on content type for simplicity (or let the client determine it)
  const ext = contentType.split("/")[1] || "bin";
  const fileKey = `${prefix}/${fileId}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
  });

  // Presigned URL expires in 15 minutes
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  return {
    uploadUrl,
    // The public URL requires setting up a Custom Domain on your R2 bucket in Cloudflare dashboard
    // Using R2 dev domain or custom domain:
    fileUrl: `https://pub-${process.env.R2_PUBLIC_DEV_DOMAIN}.r2.dev/${fileKey}`,
  };
}
