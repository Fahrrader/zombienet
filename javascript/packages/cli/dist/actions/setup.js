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
exports.setup = void 0;
const utils_1 = require("@zombienet/utils");
const cli_progress_1 = __importDefault(require("cli-progress"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const options = {};
/**
 * Setup - easily download latest artifacts and make them executablein order to use them with zombienet
 * Read more here: https://paritytech.github.io/zombienet/cli/setup.html
 * @param params binaries that willbe downloaded and set up. Possible values: `polkadot` `polkadot-parachain`
 * @returns
 */
function setup(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const POSSIBLE_BINARIES = ["polkadot", "polkadot-parachain"];
        console.log(utils_1.decorators.green("\n\n🧟🧟🧟 ZombieNet Setup 🧟🧟🧟\n\n"));
        if (!["linux", "darwin"].includes(process.platform)) {
            console.log("Zombienet currently supports linux and MacOS. \n Alternative, you can use k8s or podman. For more read here: https://github.com/paritytech/zombienet#requirements-by-provider");
            return;
        }
        console.log(utils_1.decorators.green("Gathering latest releases' versions...\n"));
        yield new Promise((resolve) => {
            latestPolkadotReleaseURL("polkadot", "polkadot").then((res) => {
                options.polkadot = {
                    name: "polkadot",
                    url: res[0],
                    size: res[1],
                };
                resolve();
            });
        });
        yield new Promise((resolve) => {
            latestPolkadotReleaseURL("cumulus", "polkadot-parachain").then((res) => {
                options["polkadot-parachain"] = {
                    name: "polkadot-parachain",
                    url: res[0],
                    size: res[1],
                };
                resolve();
            });
        });
        // If the platform is MacOS then the polkadot repo needs to be cloned and run locally by the user
        // as polkadot do not release a binary for MacOS
        if (process.platform === "darwin" && params.includes("polkadot")) {
            console.log(`${utils_1.decorators.yellow("Note: ")} You are using MacOS. Please, clone the polkadot repo ` +
                utils_1.decorators.cyan("(https://github.com/paritytech/polkadot)") +
                ` and run it locally.\n At the moment there is no polkadot binary for MacOs.\n\n`);
            params = params.filter((param) => param !== "polkadot");
        }
        if (params.length === 0) {
            console.log(utils_1.decorators.green("No binaries to download. Exiting..."));
            return;
        }
        let count = 0;
        console.log("Setup will start to download binaries:");
        params.forEach((a) => {
            var _a;
            if (!POSSIBLE_BINARIES.includes(a)) {
                params = params.filter((param) => param !== a);
                console.log(utils_1.decorators.red(`"${a}" is not one of the possible options for this setup and will be skipped;`), utils_1.decorators.green(` Valid options: polkadot polkadot-parachain`));
                return;
            }
            const size = parseInt(((_a = options[a]) === null || _a === void 0 ? void 0 : _a.size) || "0", 10);
            count += size;
            console.log("-", a, "\t Approx. size ", size, " MB");
        });
        console.log("Total approx. size: ", count, "MB");
        const response = yield (0, utils_1.askQuestion)(utils_1.decorators.yellow("\nDo you want to continue? (y/n)"));
        if (response.toLowerCase() !== "n" && response.toLowerCase() !== "y") {
            console.log("Invalid input. Exiting...");
            return;
        }
        if (response.toLowerCase() === "n") {
            return;
        }
        downloadBinaries(params);
        return;
    });
}
exports.setup = setup;
// helper fns
// Download the binaries
const downloadBinaries = (binaries) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(utils_1.decorators.yellow("\nStart download...\n"));
        const promises = [];
        const multibar = new cli_progress_1.default.MultiBar({
            clearOnComplete: false,
            hideCursor: true,
            format: utils_1.decorators.yellow("{bar} - {percentage}%") +
                " | " +
                utils_1.decorators.cyan("Binary name:") +
                " {filename}",
        }, cli_progress_1.default.Presets.shades_grey);
        for (const binary of binaries) {
            promises.push(new Promise((resolve) => __awaiter(void 0, void 0, void 0, function* () {
                var _a;
                const result = options[binary];
                if (!result) {
                    console.log("options", options, "binary", binary);
                    throw new Error("Binary is not defined");
                }
                const { url, name } = result;
                if (!url)
                    throw new Error("No url for downloading, was provided");
                const response = yield fetch(url);
                if (!response.ok)
                    throw Error(response.status + " " + response.statusText);
                const contentLength = response.headers.get("content-length");
                let loaded = 0;
                const progressBar = multibar.create(parseInt(contentLength, 10), 0);
                const reader = (_a = response.body) === null || _a === void 0 ? void 0 : _a.getReader();
                const writer = fs_1.default.createWriteStream(path_1.default.resolve(name));
                let i = true;
                while (i) {
                    const read = yield (reader === null || reader === void 0 ? void 0 : reader.read());
                    if (read === null || read === void 0 ? void 0 : read.done) {
                        writer.close();
                        i = false;
                        resolve();
                    }
                    if (read === null || read === void 0 ? void 0 : read.value) {
                        loaded += read.value.length;
                        progressBar.increment();
                        progressBar.update(loaded, {
                            filename: name,
                        });
                        writer.write(read.value);
                    }
                }
            })));
        }
        yield Promise.all(promises);
        multibar.stop();
        console.log(utils_1.decorators.cyan(`\n\nPlease add the current dir to your $PATH by running the command:\n`), utils_1.decorators.blue(`export PATH=${process.cwd()}:$PATH\n\n`));
    }
    catch (err) {
        console.log(`\n ${utils_1.decorators.red("Unexpected error: ")} \t ${utils_1.decorators.bright(err)}\n`);
    }
});
// Retrieve the latest release for polkadot
const latestPolkadotReleaseURL = (repo, name) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const releases = yield fetch(`https://api.github.com/repos/paritytech/${repo}/releases`);
        let obj;
        const allReleases = yield releases.json();
        const release = allReleases.find((r) => {
            var _a;
            obj = (_a = r === null || r === void 0 ? void 0 : r.assets) === null || _a === void 0 ? void 0 : _a.find((a) => a.name === name);
            return Boolean(obj);
        });
        const { tag_name } = release;
        if (!tag_name) {
            throw new Error("Should never come to this point. Tag_name should never be undefined!");
        }
        return [obj.browser_download_url, (0, utils_1.convertBytes)(obj.size)];
    }
    catch (err) {
        if (err.code === "ENOTFOUND") {
            throw new Error("Network error.");
        }
        else if (err.response && err.response.status === 404) {
            throw new Error("Could not find a release. Error 404 (not found) detected");
        }
        throw new Error(`Error status: ${(_b = err === null || err === void 0 ? void 0 : err.response) === null || _b === void 0 ? void 0 : _b.status}. Error message: ${err === null || err === void 0 ? void 0 : err.response}`);
    }
});
