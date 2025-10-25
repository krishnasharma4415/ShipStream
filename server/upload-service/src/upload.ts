import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import { r2Client, BUCKET_NAME } from "./r2Client";

export async function upload(file: string, fileName: string) {
  const fileContent = fs.readFileSync(file);
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: fileContent,
  });

  try {
    const response = await r2Client.send(command);
    console.log(`Uploaded ${fileName} to R2:`, response);
  } catch (error) {
    console.error(`Error uploading ${fileName}:`, error);
    throw error;
  }
}
