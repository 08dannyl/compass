import dotenv from "dotenv";
import path from "path";
import shell from "shelljs";
import { Category_VM, VmInfo } from "@scripts/common/cli.types";
import {
  COMPASS_BUILD_DEV,
  COMPASS_ROOT_DEV,
} from "@scripts/common/cli.constants";
import { getVmInfo, getPckgsTo } from "@scripts/common/cli.utils";

const buildPackages = async (pckgs: string[], vmInfo: VmInfo) => {
  if (pckgs.length === 0) {
    console.log("Ya gotta select a package to build");
    process.exit(1);
  }

  if (pckgs.includes("nodePckgs")) {
    await buildNodePckgs(vmInfo);
  }

  if (pckgs.includes("web")) {
    buildWeb(vmInfo);
  }
};

// eslint-disable-next-line @typescript-eslint/require-await
const buildNodePckgs = async (vmInfo: VmInfo) => {
  removeOldBuildFor("nodePckgs");

  console.log("Compiling node packages ...");
  // eslint-disable-next-line @typescript-eslint/require-await
  shell.exec("yarn tsc --project tsconfig.json", async function (code: number) {
    if (code !== 0) {
      console.log("Exiting because of compilation errors");
      process.exit(code);
    }

    console.log("Compiled node pckgs");

    copyConfigFilesToBuild(vmInfo);

    installProdDependencies();
  });
};

const buildWeb = (vmInfo: VmInfo) => {
  removeOldBuildFor("web");
  shell.cd(`${COMPASS_ROOT_DEV}/packages/web`);
  console.log("Getting API baseUrl ...");
  const { baseUrl, destination } = vmInfo;

  const envFile = destination === "staging" ? ".env" : ".env.prod";
  const envPath = path.join(__dirname, "..", "..", "..", "backend", envFile);
  dotenv.config({ path: envPath });

  const gClientId = process.env["CLIENT_ID"] as string;

  console.log("Compiling web files...");
  shell.exec(
    `webpack --mode=production --env API_BASEURL=${baseUrl} GOOGLE_CLIENT_ID=${gClientId}`
  );

  shell.cd(COMPASS_ROOT_DEV);
  zipWeb();
};

const copyConfigFilesToBuild = (vmInfo: VmInfo) => {
  const NODE_BUILD = `${COMPASS_BUILD_DEV}/node`;

  const envName = vmInfo.destination === "production" ? ".prod.env" : ".env";

  console.log("Copying root configs to build ...");
  shell.cp(
    `${COMPASS_ROOT_DEV}/packages/backend/${envName}`,
    `${NODE_BUILD}/.env`
  );

  console.log("Copying package configs to build ...");
  shell.cp(`${COMPASS_ROOT_DEV}/package.json`, `${NODE_BUILD}/package.json`);

  shell.cp(
    `${COMPASS_ROOT_DEV}/packages/backend/package.json`,
    `${NODE_BUILD}/packages/backend/package.json`
  );
  shell.cp(
    `${COMPASS_ROOT_DEV}/packages/core/package.json`,
    `${NODE_BUILD}/packages/core/package.json`
  );
};

const installProdDependencies = () => {
  console.log("Installing prod dependencies for node pckgs ...");

  shell.cd(`${COMPASS_BUILD_DEV}/node`);
  shell.exec("yarn install --production", function (code: number) {
    if (code !== 0) {
      console.log("exiting cuz error during compiliation");
      process.exit(code);
    }

    zipNode();
  });
};

const removeOldBuildFor = (pckg: "nodePckgs" | "web") => {
  if (pckg === "nodePckgs") {
    console.log("Removing old node build ...");
    shell.rm("-rf", [
      "build/tsconfig.tsbuildinfo",
      "build/node",
      "build/nodePckgs.zip",
    ]);
  }

  if (pckg === "web") {
    console.log("Removing old web build ...");
    shell.rm("-rf", ["build/web", "build/web.zip"]);
  }
};

export const runBuild = async (
  packages?: string[],
  environment?: Category_VM
) => {
  const pckgs = packages || (await getPckgsTo("build"));
  const vmInfo = await getVmInfo(environment);
  await buildPackages(pckgs, vmInfo);
};

const zipNode = () => {
  shell.cd(COMPASS_ROOT_DEV);
  shell.exec(`zip -q -r build/nodePckgs.zip build/node`);
};

const zipWeb = () => {
  shell.cd(COMPASS_ROOT_DEV);
  shell.exec(`zip -r build/web.zip build/web`);
};
