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
exports.spawn = void 0;
const orchestrator_1 = require("@zombienet/orchestrator");
const utils_1 = require("@zombienet/utils");
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const constants_1 = require("../constants");
/**
 * Spawn - spawns ephemeral networks, providing a simple but poweful cli that allow you to declare
 * the desired network in toml or json format.
 * Read more here: https://paritytech.github.io/zombienet/cli/spawn.html
 * @param configFile: config file, supported both json and toml formats
 * @param credsFile: Credentials file name or path> to use (Only> with kubernetes provider), we look
 *  in the current directory or in $HOME/.kube/ if a filename is passed.
 * @param _opts
 *
 * @returns Network
 */
function spawn(configFile, credsFile, cmdOpts, program) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const opts = Object.assign(Object.assign({}, program.parent.opts()), cmdOpts);
        const dir = opts.dir || "";
        const force = opts.force || false;
        const monitor = opts.monitor || false;
        // By default spawn pods/process in batches of 4,
        // since this shouldn't be a bottleneck in most of the cases,
        // but also can be set with the `-c` flag.
        const spawnConcurrency = opts.spawnConcurrency || 4;
        const configPath = (0, path_1.resolve)(process.cwd(), configFile);
        if (!fs_1.default.existsSync(configPath)) {
            console.error(`${utils_1.decorators.reverse(utils_1.decorators.red(`  ⚠ Config file does not exist: ${configPath}`))}`);
            process.exit();
        }
        const filePath = (0, path_1.resolve)(configFile);
        const config = (0, utils_1.readNetworkConfig)(filePath);
        // set default provider and timeout if not provided
        if (!config.settings) {
            config.settings = {
                provider: constants_1.DEFAULT_PROVIDER,
                timeout: constants_1.DEFAULT_GLOBAL_TIMEOUT,
            };
        }
        else {
            if (!config.settings.provider)
                config.settings.provider = constants_1.DEFAULT_PROVIDER;
            if (!config.settings.timeout)
                config.settings.timeout = constants_1.DEFAULT_GLOBAL_TIMEOUT;
        }
        // if a provider is passed, let just use it.
        if (opts.provider && constants_1.AVAILABLE_PROVIDERS.includes(opts.provider)) {
            config.settings.provider = opts.provider;
        }
        let creds = "";
        if (((_a = config.settings) === null || _a === void 0 ? void 0 : _a.provider) === "kubernetes") {
            creds = (0, utils_1.getCredsFilePath)(credsFile || "config") || "";
            if (!creds) {
                console.log(`Running ${((_b = config.settings) === null || _b === void 0 ? void 0 : _b.provider) || constants_1.DEFAULT_PROVIDER} provider:`);
                console.error(`${utils_1.decorators.reverse(utils_1.decorators.red(`  ⚠ I can't find the Creds file: ${credsFile}`))}`);
                process.exit();
            }
        }
        const inCI = process.env.RUN_IN_CONTAINER === "1";
        const options = {
            monitor,
            spawnConcurrency,
            dir,
            force,
            inCI,
            silent: false,
        };
        const network = yield (0, orchestrator_1.start)(creds, config, options);
        network.showNetworkInfo((_c = config.settings) === null || _c === void 0 ? void 0 : _c.provider);
        return network;
    });
}
exports.spawn = spawn;
