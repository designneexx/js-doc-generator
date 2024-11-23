#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/cli.ts
var cli_exports = {};
__export(cli_exports, {
  start: () => start
});
module.exports = __toCommonJS(cli_exports);
var import_commander = require("commander");

// package.json
var package_default = {
  name: "auto-js-doc-generator",
  version: "1.0.11",
  scripts: {
    test: 'echo "Error: no test specified" && exit 1',
    "lint:check": 'eslint src "src/**/*.{ts,tsx}"',
    "lint:write": 'eslint src "src/**/*.{ts,tsx}" --fix',
    "build:rollup": "rollup -c=rollup.config.mjs",
    commit: "git-cz",
    changelog: "conventional-changelog -o CHANGELOG.md",
    postcommit: "npm run changelog",
    compile: "webpack"
  },
  keywords: [],
  author: "designneexx <webmasterondesign@gmail.com>",
  main: "dist/index.js",
  types: "dist/index.d.ts",
  bin: {
    "auto-js-doc-gen": "dist/cli.js"
  },
  license: "ISC",
  description: "\u041F\u043E\u0437\u0432\u043E\u043B\u044F\u0435\u0442 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0433\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430\u0446\u0438\u044E JSDoc \u043A \u0432\u0430\u0448\u0435\u043C\u0443 \u043A\u043E\u0434\u0443",
  files: [
    "README.md",
    "CHANGELOG.md",
    "package.json",
    "dist"
  ],
  config: {
    commitizen: {
      path: "./node_modules/cz-conventional-changelog"
    }
  },
  dependencies: {
    axios: "^1.7.7",
    chalk: "^5.3.0",
    commander: "^12.1.0",
    crypto: "^1.0.1",
    "crypto-js": "^4.2.0",
    eslint: "^9.13.0",
    "file-system-cache": "^2.4.7",
    glob: "^11.0.0",
    "rollup-plugin-delete": "^2.1.0",
    terser: "^5.36.0",
    "ts-morph": "^24.0.0",
    "ts-node": "^10.9.2",
    typescript: "^5.6.3",
    uuid: "^11.0.2",
    winston: "^3.17.0",
    workerpool: "^9.2.0",
    zod: "^3.23.8"
  },
  devDependencies: {
    "@eslint/eslintrc": "^3.1.0",
    "@eslint/js": "^9.13.0",
    "@rollup/plugin-commonjs": "^28.0.1",
    "@rollup/plugin-json": "^6.1.0",
    "@rollup/plugin-node-resolve": "^15.3.0",
    "@rollup/plugin-terser": "^0.4.4",
    "@rollup/plugin-typescript": "^12.1.1",
    "@types/chalk": "^0.4.31",
    "@types/crypto-js": "^4.2.2",
    "@types/eslint": "^9.6.1",
    "@types/glob": "^8.1.0",
    "@types/node": "^22.8.6",
    "@types/uuid": "^10.0.0",
    "@types/winston": "^2.4.4",
    commitizen: "^4.3.1",
    "conventional-changelog-cli": "^5.0.0",
    "cz-conventional-changelog": "^3.3.0",
    esbuild: "0.24.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.31.0",
    "eslint-plugin-prettier": "^5.2.1",
    "eslint-plugin-unused-imports": "^4.1.4",
    prettier: "^3.3.3",
    rollup: "^4.24.3",
    "rollup-plugin-dts": "^6.1.1",
    "rollup-plugin-peer-deps-external": "^2.2.4",
    "rollup-plugin-preserve-shebang": "^1.0.1",
    "ts-loader": "^9.5.1",
    "typescript-eslint": "^8.12.2",
    webpack: "^5.96.1",
    "webpack-cli": "^5.1.4"
  }
};

// src/utils/helpers/loadConfigFile.ts
var import_fs = __toESM(require("fs"));
var import_promises = __toESM(require("fs/promises"));
var import_path = __toESM(require("path"));
var import_register = require("ts-node/register");
var import_url = require("url");
var import_ts_morph = require("ts-morph");
var possibleConfigFiles = [
  "jsdocgen.config.ts",
  "jsdocgen.config.mts",
  "jsdocgen.config.cts",
  "jsdocgen.config.js",
  "jsdocgen.config.mjs",
  "jsdocgen.config.cjs"
];
function findConfigFile() {
  for (const configFile of possibleConfigFiles) {
    const resolvedPath = import_path.default.resolve(process.cwd(), configFile);
    if (import_fs.default.existsSync(resolvedPath)) {
      return resolvedPath;
    }
  }
  throw new Error("\u041A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u0444\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
}
async function loadConfig() {
  const configPath = findConfigFile();
  const project = new import_ts_morph.Project({
    tsConfigFilePath: "tsconfig.json",
    compilerOptions: {
      outDir: import_path.default.resolve(__dirname, "compiled")
    },
    skipAddingFilesFromTsConfig: true
  });
  project.addSourceFileAtPath(configPath);
  const memoryEmitResult = await project.emitToMemory();
  const memoryEmitResultFiles = memoryEmitResult.getFiles();
  const findedConfigFile = memoryEmitResultFiles.find(
    (file) => possibleConfigFiles.includes(import_path.default.basename(file.filePath))
  );
  if (!findedConfigFile) {
    return null;
  }
  await memoryEmitResult.saveFiles();
  const dir = import_path.default.dirname(findedConfigFile.filePath);
  const oldPath = import_path.default.join(dir, import_path.default.basename(findedConfigFile.filePath));
  const newPath = import_path.default.join(dir, "jsdocgen.config.mjs");
  await import_promises.default.rename(oldPath, newPath);
  const config = await import((0, import_url.pathToFileURL)(newPath).href);
  return config.default;
}

// src/cli.ts
var import__ = require(".");
var program = new import_commander.Command();
program.name("js-doc-generator").description("CLI \u0434\u043B\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0439 \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 JSDoc").version(package_default.version);
program.command("generate").description(
  "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0438 JSDoc \u043A \u0432\u0430\u0448\u0435\u043C\u0443 \u0441\u043F\u0438\u0441\u043A\u0443 \u0444\u0430\u0439\u043B\u043E\u0432. \u041F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E TypeScript"
).argument("<string>", "glob \u0432\u0430\u0448\u0438 \u0444\u0430\u0439\u043B\u044B \u0434\u043B\u044F \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438").action(async (files) => {
  await start({ files: [files] });
});
program.parse();
async function start(overrideConfig) {
  const config = await loadConfig();
  if (!config) return;
  await (0, import__.init)({ ...config, ...overrideConfig });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  start
});
