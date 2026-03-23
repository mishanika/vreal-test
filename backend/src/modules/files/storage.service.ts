import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly s3: S3Client;
  private readonly logger = new Logger(StorageService.name);
  readonly bucket: string;

  constructor() {
    this.bucket = process.env.MINIO_BUCKET ?? "vreal";
    this.s3 = new S3Client({
      endpoint: process.env.MINIO_ENDPOINT ?? "http://localhost:9000",
      region: "us-east-1",
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY ?? "vreal_admin",
        secretAccessKey: process.env.MINIO_SECRET_KEY ?? "vreal_secret123",
      },
      forcePathStyle: true,
    });
  }

  async onModuleInit(): Promise<void> {
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        await this.ensureBucket();
        return;
      } catch (err) {
        if (attempt === 5) {
          this.logger.error(`Could not initialise MinIO bucket after ${attempt} attempts: ${err}`);
        } else {
          this.logger.warn(`MinIO not ready (attempt ${attempt}), retrying in 2 s…`);
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }
  }

  private async ensureBucket(): Promise<void> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${this.bucket}/*`],
          },
        ],
      };
      await this.s3.send(new PutBucketPolicyCommand({ Bucket: this.bucket, Policy: JSON.stringify(policy) }));
      this.logger.log(`Created bucket "${this.bucket}" with public-read policy`);
    }
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<void> {
    await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: contentType }));
  }

  async download(key: string): Promise<Buffer> {
    const res = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const stream = res.Body as Readable;
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      stream.on("data", (c: Uint8Array) => chunks.push(c));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    await this.s3.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destKey,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (err) {
      this.logger.warn(`Could not delete object "${key}": ${err}`);
    }
  }
}
