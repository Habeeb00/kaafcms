import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// R2 Client Setup - Initialize inside the request or use a lazy getter to ensure env vars are populated
function getS3Client() {
  const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
  const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
  const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.warn("R2 environment variables are missing");
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const s3Client = getS3Client();
    const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
    const R2_PUBLIC_DEV_DOMAIN = process.env.R2_PUBLIC_DEV_DOMAIN;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const folder = formData.get("folder") as string || "general";
      const subFolder = formData.get("subFolder") as string || "";

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

      // Construct structured path: assets/{folder}/{subFolder}/{filename}
      const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "_");
      const sanitizedSubFolder = subFolder.replace(/[^a-zA-Z0-9_-]/g, "_");
      
      const fileKey = subFolder 
        ? `assets/${sanitizedFolder}/${sanitizedSubFolder}/${filename}`
        : `assets/${sanitizedFolder}/${filename}`;

      // 1. Prioritize Cloudflare R2 if client and bucket are ready
      if (s3Client && R2_BUCKET_NAME) {
        console.log(`Attempting R2 upload to bucket: ${R2_BUCKET_NAME}, key: ${fileKey}`);
        try {
          await s3Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: fileKey,
            Body: buffer,
            ContentType: file.type,
          }));
          console.log("R2 upload successful");
          
          const publicUrl = R2_PUBLIC_DEV_DOMAIN 
            ? `https://pub-${R2_PUBLIC_DEV_DOMAIN}.r2.dev/${fileKey}`
            : `/api/r2-proxy?key=${fileKey}`; 

          return NextResponse.json({ url: publicUrl });
        } catch (s3Error: any) {
          console.error("R2 Upload failed, falling back to local storage:", s3Error.message);
          // Fall through to local storage
        }
      }

      console.warn("Using local storage fallback");
      const uploadDir = path.join(process.cwd(), "..", "public", fileKey);
      const dirPath = path.dirname(uploadDir);
      await mkdir(dirPath, { recursive: true });
      await writeFile(uploadDir, buffer);

      return NextResponse.json({ url: `/${fileKey}` });
    }

    return NextResponse.json({ error: "Method not allowed or missing multipart data" }, { status: 405 });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
