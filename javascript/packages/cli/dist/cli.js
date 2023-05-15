#!/usr/bin/env node
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
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@zombienet/utils");
const commander_1 = require("commander");
const convert_1 = require("./actions/convert");
const setup_1 = require("./actions/setup");
const spawn_1 = require("./actions/spawn");
const test_1 = require("./actions/test");
const debug = require("debug")("zombie-cli");
const program = new commander_1.Command("zombienet");
let network;
let alreadyTryToStop = false;
const setGlobalNetwork = (globalNetwork) => {
    network = globalNetwork;
};
function handleTermination(userInterrupted = false) {
    return __awaiter(this, void 0, void 0, function* () {
        process.env.terminating = "1";
        if (network && !alreadyTryToStop) {
            alreadyTryToStop = true;
            if (userInterrupted)
                console.log("Ctrl+c detected...");
            debug("removing namespace: " + network.namespace);
            yield network.dumpLogs();
            console.log(utils_1.decorators.blue("Tearing down network..."));
            yield network.stop();
        }
    });
}
// Ensure to log the uncaught exceptions
// to debug the problem, also exit because we don't know
// what happens there.
process.on("uncaughtException", (err) => __awaiter(void 0, void 0, void 0, function* () {
    yield handleTermination();
    console.log(`uncaughtException`);
    console.log(err);
    debug(err);
    process.exit(100);
}));
// Ensure that we know about any exception thrown in a promise that we
// accidentally don't have a 'catch' for.
// http://www.hacksrus.net/blog/2015/08/a-solution-to-swallowed-exceptions-in-es6s-promises/
process.on("unhandledRejection", (err) => __awaiter(void 0, void 0, void 0, function* () {
    yield handleTermination();
    debug(err);
    console.log(`\n${utils_1.decorators.red("UnhandledRejection: ")} \t ${utils_1.decorators.bright(err)}\n`);
    process.exit(1001);
}));
// Handle ctrl+c to trigger `exit`.
process.on("SIGINT", function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield handleTermination();
        process.exit();
    });
});
process.on("SIGTERM", function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield handleTermination();
        process.exit();
    });
});
process.on("exit", function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield handleTermination();
        const exitCode = process.exitCode !== undefined ? process.exitCode : 2;
        // use exitCode set by mocha or 2 as default.
        process.exit(exitCode);
    });
});
program
    .addOption(new commander_1.Option("-c, --spawn-concurrency <concurrency>", "Number of concurrent spawning process to launch, default is 1"))
    .addOption(new commander_1.Option("-p, --provider <provider>", "Override provider to use").choices(["podman", "kubernetes", "native"]))
    .addOption(new commander_1.Option("-d, --dir <path>", "Directory path for placing the network files instead of random temp one (e.g. -d /home/user/my-zombienet)"))
    .addOption(new commander_1.Option("-f, --force", "Force override all prompt commands"));
program
    .command("spawn")
    .description("Spawn the network defined in the config")
    .argument("<networkConfig>", "Network config file path")
    .argument("[creds]", "kubeclt credentials file")
    .addOption(new commander_1.Option("-m, --monitor", "Start as monitor, do not auto cleanup network"))
    .action(asyncAction(spawn_1.spawn));
program
    .command("test")
    .description("Run tests on the network defined")
    .argument("<testFile>", "ZNDSL file (.zndsl) describing the tests")
    .argument("[runningNetworkSpec]", "Path to the network spec json, for using a running network for running the test")
    .action(asyncAction(test_1.test));
program
    .command("setup")
    .description("Setup is meant for downloading and making dev environment of ZombieNet ready")
    .argument("<binaries...>", `the binaries that you want to be downloaded, provided in a row without any separators;\nThey are downloaded in current directory and appropriate executable permissions are assigned.\nPossible options: 'polkadot', 'polkadot-parachain'\n${utils_1.decorators.blue("zombienet setup polkadot polkadot-parachain")}`)
    .action(asyncAction(setup_1.setup));
program
    .command("convert")
    .description("Convert is meant for transforming a (now deprecated) polkadot-launch configuration to zombienet configuration")
    .argument("<filePath>", `Expecting 1 mandatory param which is the path of the polkadot-lauch configuration file (could be either a .js or .json file).`)
    .action(asyncAction(convert_1.convert));
program
    .command("version")
    .description("Prints zombienet version")
    .action(() => {
    const p = require("../package.json");
    console.log(p.version);
    process.exit(0);
});
program.parse(process.argv);
function asyncAction(cmd) {
    return function () {
        // eslint-disable-next-line prefer-rest-params
        const args = [...arguments];
        (() => __awaiter(this, void 0, void 0, function* () {
            try {
                if (cmd.name == "spawn") {
                    yield cmd(...args, setGlobalNetwork);
                }
                else {
                    yield cmd(...args);
                }
            }
            catch (err) {
                console.log(`\n ${utils_1.decorators.red("Error: ")} \t ${utils_1.decorators.bright(err)}\n`);
                process.exit(1);
            }
        }))();
    };
}
