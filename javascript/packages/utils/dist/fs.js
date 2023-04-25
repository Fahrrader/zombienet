"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readDataFile = exports.readNetworkConfig = exports.getCredsFilePath = exports.makeDir = exports.loadTypeDef = exports.askQuestion = exports.writeLocalJsonFile = void 0;
const fs_1 = __importDefault(require("fs"));
const nunjucks_1 = require("nunjucks");
const path_1 = __importDefault(require("path"));
const readline_1 = __importDefault(require("readline"));
const toml_1 = __importDefault(require("toml"));
const yaml_1 = __importDefault(require("yaml"));
const colors_1 = require("./colors");
const nunjucksRelativeLoader_1 = require("./nunjucksRelativeLoader");
function writeLocalJsonFile(path, fileName, content) {
    fs_1.default.writeFileSync(`${path}/${fileName}`, JSON.stringify(content, null, 4));
}
exports.writeLocalJsonFile = writeLocalJsonFile;
/**
 * askQuestion: ask for user's Input
 * @param query : The string of the "question"
 * @returns
 */
const askQuestion = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => rl.question(query, (ans) => {
        rl.close();
        resolve(ans);
    }));
});
exports.askQuestion = askQuestion;
function loadTypeDef(types) {
    if (typeof types === "string") {
        // Treat types as a json file path
        try {
            const rawdata = fs_1.default.readFileSync(types, { encoding: "utf-8" });
            return JSON.parse(rawdata);
        }
        catch (_a) {
            console.error(`${colors_1.decorators.reverse(colors_1.decorators.red(`  failed to load parachain typedef file`))}`);
            process.exit(1);
        }
    }
    else {
        return types;
    }
}
exports.loadTypeDef = loadTypeDef;
function makeDir(dir, recursive = false) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!fs_1.default.existsSync(dir)) {
            yield fs_1.default.promises.mkdir(dir, { recursive });
        }
    });
}
exports.makeDir = makeDir;
function getCredsFilePath(credsFile) {
    if (fs_1.default.existsSync(credsFile))
        return credsFile;
    const possiblePaths = [".", "..", `${process.env.HOME}/.kube`];
    const credsFileExistInPath = possiblePaths.find((path) => {
        const t = `${path}/${credsFile}`;
        return fs_1.default.existsSync(t);
    });
    if (credsFileExistInPath)
        return `${credsFileExistInPath}/${credsFile}`;
}
exports.getCredsFilePath = getCredsFilePath;
function getReplacementInText(content) {
    const replacements = [];
    // allow to replace with env vars, to make more dynamic usage of ci.
    // eslint-disable-next-line no-useless-escape
    const replacementRegex = /{{([A-Za-z-_\.]+)}}/gim;
    for (const match of content.matchAll(replacementRegex)) {
        replacements.push(match[1]);
    }
    return replacements;
}
const parseConfigFile = (content, filepath, configBasePath) => {
    var _a;
    // eslint-disable-next-line no-useless-escape
    const jsonChar = /[\{]/;
    // eslint-disable-next-line no-useless-escape
    const tomlChar = /[\[]/;
    // eslint-disable-next-line no-useless-escape
    const yamlChar = /[A-Za-z\-\#]/;
    const fileType = (_a = filepath === null || filepath === void 0 ? void 0 : filepath.split(".")) === null || _a === void 0 ? void 0 : _a.pop();
    if (!fileType) {
        throw new Error(`${colors_1.decorators.bright("Error - config file has no extension.")}`);
    }
    const data = fs_1.default.readFileSync(filepath, "utf-8");
    const lines = data.split(/\r?\n/);
    let firstChar;
    for (const line of lines) {
        // Avoid any lines with comments or empty lines
        if (!line || ["#", "/", " "].includes(line[0])) {
            continue;
        }
        else {
            firstChar = line[0];
            break;
        }
    }
    if (!firstChar) {
        throw new Error(`${colors_1.decorators.bright("Config file has no valid characters.")}`);
    }
    let config = {};
    if ((fileType === null || fileType === void 0 ? void 0 : fileType.toLocaleLowerCase()) === "json" && jsonChar.test(firstChar)) {
        config = JSON.parse(content);
    }
    else if ((fileType === null || fileType === void 0 ? void 0 : fileType.toLocaleLowerCase()) === "toml" &&
        tomlChar.test(firstChar)) {
        config = toml_1.default.parse(content);
    }
    else if ((fileType === null || fileType === void 0 ? void 0 : fileType.toLocaleLowerCase()) === "yaml" &&
        yamlChar.test(firstChar)) {
        config = yaml_1.default.parse(content);
    }
    else {
        throw new Error(`${colors_1.decorators.bright("config file is not one of the known types: 'json', 'toml' or 'yaml'.")}`);
    }
    config.configBasePath = configBasePath;
    return config;
};
function readNetworkConfig(filepath) {
    const configBasePath = path_1.default.dirname(filepath);
    const env = new nunjucks_1.Environment(new nunjucksRelativeLoader_1.RelativeLoader([configBasePath]));
    env.addFilter("zombie", function (nodeName, key) {
        return `{{ZOMBIE:${nodeName}:${key}}}`;
    });
    env.addFilter("chainSpec", function (chainSpecType) {
        return `{{CHAIN_SPEC:${chainSpecType.toUpperCase()}}}`;
    });
    const temmplateContent = fs_1.default.readFileSync(filepath).toString();
    const content = env.renderString(temmplateContent, process.env);
    //  check if we have missing replacements
    const replacements = getReplacementInText(content);
    if (replacements.length > 0) {
        throw new Error(`Environment not set for : ${replacements.join(",")}`);
    }
    return parseConfigFile(content, filepath, configBasePath);
}
exports.readNetworkConfig = readNetworkConfig;
function readDataFile(filepath) {
    try {
        const fileData = fs_1.default.readFileSync(filepath, "utf8");
        return fileData.trim();
    }
    catch (err) {
        throw Error(colors_1.decorators.red(`Cannot read ${filepath}: ${err}`));
    }
}
exports.readDataFile = readDataFile;
