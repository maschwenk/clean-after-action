const core = require("@actions/core");
const io = require("@actions/io");
const fs = require("fs");
const { getExecOutput } = require("@actions/exec");

function getBoolValue(name) {
  return ["true", "1", "yes", "y"].includes(
    core.getInput(name).trim().toLowerCase()
  );
}

async function rimRafWorkingDir() {
  const keepGit = getBoolValue("keep-git");
  await fs.readdir(".", async (err, files) => {
    if (err) {
      throw new Error(`Failed to list files: ${err}`);
    }
    for (const file of files) {
      if (keepGit && file === ".git") {
        continue;
      }
      console.log(`Deleting ${file}`);
      await io.rmRF(file);
    }
  });
}

async function cleanupDanglingDockerResources() {
  const runningStuff = await getExecOutput('docker ps -a -q');
  if (runningStuff.stdout === "") {
    console.log("Skipping docker cleanup, no running containers");
  } else {
    console.log("Stopping running containers");
    await getExecOutput(`docker stop ${runningStuff.stdout}`);
    console.log("Stopped all running Docker containers");
  }
}


async function main() {
  try {
    await Promise.all([cleanupDanglingDockerResources(), rimRafWorkingDir()]);
  } catch (error) {
    core.setFailed(error.message);
  }
}

main()
  .then(() => console.log("Finished"))
  .catch((err) => console.log(`Failed to delete files: ${err}`));

