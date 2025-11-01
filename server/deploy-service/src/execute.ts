import { exec } from "child_process";
import path from "path";

export function buildProject(id: string) {
  return new Promise((resolve, reject) => {
    const projectPath = path.join(__dirname, `output/${id}`);
    console.log(`Building project at: ${projectPath}`);
    
    const child = exec(
      `cd "${projectPath}" && npm i && npm run build`,
      { maxBuffer: 1024 * 1024 * 10 } // 10MB buffer for large build outputs
    );

    child.stdout?.on('data', (data) => {
      console.log(`Build stdout: ${data}`);
    });

    child.stderr?.on('data', (data) => {
      console.error(`Build stderr: ${data}`);
    });

    child.on("close", function (code) {
      console.log(`Build process exited with code: ${code}`);
      if (code === 0) {
        resolve("");
      } else {
        reject(new Error(`Build failed with exit code: ${code}`));
      }
    });

    child.on("error", function (error) {
      console.error(`Build process error: ${error}`);
      reject(error);
    });
  });
}
