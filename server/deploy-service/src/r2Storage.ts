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
  const projectPath = path.join(__dirname, `output/${id}`);
  
  // Common build output directories for different frameworks
  const possibleBuildDirs = ['dist', 'build', 'out', 'public'];
  
  let buildDir = null;
  let folderPath = null;
  
  // Find which build directory exists
  for (const dir of possibleBuildDirs) {
    const testPath = path.join(projectPath, dir);
    if (fs.existsSync(testPath)) {
      buildDir = dir;
      folderPath = testPath;
      console.log(`Found build directory: ${dir}`);
      break;
    }
  }
  
  // If no standard build directory found, check if there are any HTML files in the root
  if (!folderPath) {
    const rootFiles = fs.readdirSync(projectPath);
    const hasHtmlFiles = rootFiles.some(file => file.endsWith('.html'));
    
    if (hasHtmlFiles) {
      console.log('No build directory found, using project root (static files detected)');
      folderPath = projectPath;
      buildDir = '';
    } else {
      throw new Error(`No build output found in ${projectPath}. Checked directories: ${possibleBuildDirs.join(', ')}`);
    }
  }
  
  const allFiles = getAllFiles(folderPath);
  console.log(`Uploading ${allFiles.length} files from ${buildDir || 'root'} directory`);
  
  allFiles.forEach((file) => {
    const relativePath = file.slice(folderPath.length + 1);
    uploadFile(`dist/${id}/${relativePath}`, file);
  });
}

const getAllFiles = (folderPath: string): string[] => {
  let response: string[] = [];

  if (!fs.existsSync(folderPath)) {
    console.error(`Directory does not exist: ${folderPath}`);
    return response;
  }

  try {
    const allFilesAndFolders = fs.readdirSync(folderPath);
    allFilesAndFolders.forEach((file) => {
      const fullFilePath = path.join(folderPath, file);
      if (fs.statSync(fullFilePath).isDirectory()) {
        response = response.concat(getAllFiles(fullFilePath));
      } else {
        response.push(fullFilePath);
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${folderPath}:`, error);
  }
  
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