import { S3 } from "aws-sdk";
import fs from "fs";

const s3 = new S3({
  accessKeyId: process.env.ACCESSID,
  secretAccessKey: process.env.ACCESSKEY,
  endpoint: process.env.ENDPOINT,
});

export async function upload(file: string, fileName: string) {
  const fileContent = fs.readFileSync(file);
  const response = await s3
    .upload({
      Body: fileContent,
      Bucket: "vercel",
      Key: fileName,
    })
    .promise();
  console.log(response);
}
