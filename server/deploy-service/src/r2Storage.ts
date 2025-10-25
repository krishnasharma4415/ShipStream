import { ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { r2Client, BUCKET_NAME } from "./r2Client";

export async function downloadR2Folder(prefix: string) {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });

  const allFiles = await r2Client.send(command);

  const allPromises =
    allFiles.Contents?.map(async ({ Key }) => {
      return new Promise(async (resolve) => {
        if (!Key) {
          resolve("");
          return;
        }
        const finalOutputPath = path.join(__dirname, Key);
        const dirName = path.dirname(finalOutputPath);
        if (!fs.existsSync(dirName)) {
          fs.mkdirSync(dirName, { recursive: true });
        }

        try {
          const getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key,
          });
          
          const response = await r2Client.send(getCommand);
          const chunks: Uint8Array[] = [];
          
          if (response.Body) {
            const stream = response.Body as any;
            for await (const chunk of stream) {
              chunks.push(chunk);
            }
            const fileContent = Buffer.concat(chunks);
            fs.writeFileSync(finalOutputPath, fileContent);
          }
          resolve("");
        } catch (error) {
          console.error(`Error downloading ${Key}:`, error);
          resolve("");
        }
      });
    }) || [];
  console.log("Downloading files from R2...");

  await Promise.all(allPromises?.filter((x) => x !== undefined));
}

export function copyFinalDist(id: string) {
  const folderPath = path.join(__dirname, `output/${id}/dist`);
  const allFiles = getAllFiles(folderPath);
  allFiles.forEach((file) => {
    uploadFile(`dist/${id}/` + file.slice(folderPath.length + 1), file);
  });
}

const getAllFiles = (folderPath: string) => {
  let response: string[] = [];

  const allFilesAndFolders = fs.readdirSync(folderPath);
  allFilesAndFolders.forEach((file) => {
    const fullFilePath = path.join(folderPath, file);
    if (fs.statSync(fullFilePath).isDirectory()) {
      response = response.concat(getAllFiles(fullFilePath));
    } else {
      response.push(fullFilePath);
    }
  });
  return response;
};

const uploadFile = async (fileName: string, localFilePath: string) => {
  const fileContent = fs.readFileSync(localFilePath);
  
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
};