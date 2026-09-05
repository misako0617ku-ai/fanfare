import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export type MediaType = "image" | "video";

export function validateMediaUpload(mimeType: string, sizeBytes: number): MediaType {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    if (sizeBytes > MAX_IMAGE_SIZE) throw new Error("画像は10MB以内にしてください");
    return "image";
  }
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) {
    if (sizeBytes > MAX_VIDEO_SIZE) throw new Error("動画は50MB以内にしてください");
    return "video";
  }
  throw new Error("対応していないファイル形式です");
}

export async function createUploadPresignedUrl(
  mimeType: string,
  sizeBytes: number
): Promise<{ url: string; key: string; mediaType: MediaType }> {
  const mediaType = validateMediaUpload(mimeType, sizeBytes);
  const ext = mimeType.split("/")[1].replace("jpeg", "jpg");
  const key = `media/${uuidv4()}.${ext}`;

  const url = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: mimeType,
      ContentLength: sizeBytes,
    }),
    { expiresIn: 300 } // 5 minutes
  );

  return { url, key, mediaType };
}

export async function createViewPresignedUrl(key: string): Promise<string> {
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 300 } // 5 minutes
  );
}

export async function deleteObject(key: string): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
