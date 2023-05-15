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
exports.test = void 0;
const dsl_parser_wrapper_1 = __importDefault(require("@zombienet/dsl-parser-wrapper"));
const orchestrator_1 = require("@zombienet/orchestrator");
const utils_1 = require("@zombienet/utils");
const fs_1 = __importDefault(require("fs"));
const nunjucks_1 = require("nunjucks");
const path_1 = __importDefault(require("path"));
const constants_1 = require("../constants");
/**
 * Test - performs test/assertions against the spawned network, using a set of natural
 * language expressions that allow to make assertions based on metrics, logs and some
 * built-in function that query the network using polkadot.js
 * Read more here: https://paritytech.github.io/zombienet/cli/testing.html
 * @param testFile
 * @param runningNetworkSpec
 * @param opts (commander)
 * @param program (commander)
 */
function test(testFile, runningNetworkSpec, cmdOpts, program) {
    return __awaiter(this, void 0, void 0, function* () {
        const opts = Object.assign(Object.assign({}, program.parent.opts()), cmdOpts);
        const dir = opts.dir || "";
        const extension = testFile.slice(testFile.lastIndexOf(".") + 1);
        if (extension !== "zndsl") {
            console.log(`\n ${utils_1.decorators.red("Error:")} File extension is not correct. Extension for tests should be '.zndsl'.\n`);
        }
        process.env.DEBUG = "zombie";
        const inCI = process.env.RUN_IN_CONTAINER === "1";
        // use `k8s` as default
        const providerToUse = opts.provider && constants_1.AVAILABLE_PROVIDERS.includes(opts.provider)
            ? opts.provider
            : "kubernetes";
        const configBasePath = path_1.default.dirname(testFile);
        const env = new nunjucks_1.Environment(new utils_1.RelativeLoader([configBasePath]));
        const templateContent = fs_1.default.readFileSync(testFile).toString();
        const content = env.renderString(templateContent, process.env);
        const testName = getTestNameFromFileName(testFile);
        let testDef;
        try {
            testDef = JSON.parse(dsl_parser_wrapper_1.default.parse_to_json(content));
        }
        catch (e) {
            console.log(`\n ${utils_1.decorators.red("Error:")} \t ${utils_1.decorators.bright(e)}\n`);
            process.exit(1);
        }
        yield (0, orchestrator_1.run)(configBasePath, testName, testDef, providerToUse, inCI, opts.spawnConcurrency, false, runningNetworkSpec, dir);
    });
}
exports.test = test;
function getTestNameFromFileName(testFile) {
    const fileWithOutExt = testFile.split(".")[0];
    const fileName = fileWithOutExt.split("/").pop() || "";
    const parts = fileName.split("-");
    const name = parts[0].match(/\d/)
        ? parts.slice(1).join(" ")
        : parts.join(" ");
    return name;
}
