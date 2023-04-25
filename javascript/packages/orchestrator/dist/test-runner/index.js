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
exports.run = void 0;
const utils_1 = require("@zombienet/utils");
const fs_1 = __importDefault(require("fs"));
const mocha_1 = __importDefault(require("mocha"));
const path_1 = __importDefault(require("path"));
const network_1 = require("../network");
const orchestrator_1 = require("../orchestrator");
const providers_1 = require("../providers");
const assertions_1 = __importDefault(require("./assertions"));
const commands_1 = __importDefault(require("./commands"));
const DEFAULT_GLOBAL_TIMEOUT = 1200; // 20 mins
const debug = require("debug")("zombie::test-runner");
const { Test, Suite } = mocha_1.default;
const mocha = new mocha_1.default();
function run(configBasePath, testName, testDef, provider, inCI = false, concurrency = 1, silent = false, runningNetworkSpecPath, dir) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, utils_1.setSilent)(silent);
        let network;
        const backchannelMap = {};
        let suiteName = testName;
        if (testDef.description)
            suiteName += `( ${testDef.description} )`;
        // read network file
        const networkConfigFilePath = fs_1.default.existsSync(testDef.network)
            ? testDef.network
            : path_1.default.resolve(configBasePath, testDef.network);
        const config = (0, utils_1.readNetworkConfig)(networkConfigFilePath);
        // set the provider
        if (!config.settings)
            config.settings = { provider, timeout: DEFAULT_GLOBAL_TIMEOUT };
        else
            config.settings.provider = provider;
        // find creds file
        const credsFile = inCI ? "config" : testDef.creds;
        let creds;
        if (fs_1.default.existsSync(credsFile))
            creds = credsFile;
        else {
            const possiblePaths = [
                ".",
                "..",
                `${process.env.HOME}/.kube`,
                "/etc/zombie-net",
            ];
            const credsFileExistInPath = possiblePaths.find((path) => {
                const t = `${path}/${credsFile}`;
                return fs_1.default.existsSync(t);
            });
            if (credsFileExistInPath)
                creds = credsFileExistInPath + "/" + credsFile;
        }
        if (!creds && config.settings.provider === "kubernetes")
            throw new Error(`Invalid credential file path: ${credsFile}`);
        // create suite
        const suite = Suite.create(mocha.suite, suiteName);
        suite.beforeAll("launching", function () {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                const launchTimeout = ((_a = config.settings) === null || _a === void 0 ? void 0 : _a.timeout) || 500;
                this.timeout(launchTimeout * 1000);
                try {
                    if (!runningNetworkSpecPath) {
                        console.log(`\t Launching network... this can take a while.`);
                        network = yield (0, orchestrator_1.start)(creds, config, {
                            spawnConcurrency: concurrency,
                            inCI,
                            silent,
                            dir,
                        });
                    }
                    else {
                        const runningNetworkSpec = require(runningNetworkSpecPath);
                        if (provider !== runningNetworkSpec.client.providerName)
                            throw new Error(`Invalid provider, the provider set doesn't match with the running network definition`);
                        const { client, namespace, tmpDir } = runningNetworkSpec;
                        // initialize the Client
                        const initClient = providers_1.Providers.get(runningNetworkSpec.client.providerName).initClient(client.configPath, namespace, tmpDir);
                        // initialize the network
                        network = (0, network_1.rebuildNetwork)(initClient, runningNetworkSpec);
                    }
                    network.showNetworkInfo(config.settings.provider);
                    yield (0, utils_1.sleep)(5 * 1000);
                    return;
                }
                catch (err) {
                    console.log(`\n${utils_1.decorators.red("Error launching the network!")} \t ${utils_1.decorators.bright(err)}`);
                    exitMocha(100);
                }
            });
        });
        suite.afterAll("teardown", function () {
            var _a, _b;
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(180 * 1000);
                if (network && !network.wasRunning) {
                    const logsPath = yield network.dumpLogs(false);
                    const tests = (_b = (_a = this.test) === null || _a === void 0 ? void 0 : _a.parent) === null || _b === void 0 ? void 0 : _b.tests;
                    if (tests) {
                        const failed = tests.filter((test) => {
                            return test.state !== "passed";
                        });
                        if (failed.length) {
                            console.log(`\n\n\t${utils_1.decorators.red("❌ One or more of your test failed...")}`);
                        }
                        // All test passed, just remove the network
                        console.log(`\n\t ${utils_1.decorators.green("Deleting network")}`);
                        yield network.stop();
                        // show logs
                        console.log(`\n\n\t${utils_1.decorators.magenta("📓 To see the full logs of the nodes please go to:")}`);
                        switch (network.client.providerName) {
                            case "podman":
                            case "native":
                                console.log(`\n\t${utils_1.decorators.magenta(logsPath)}`);
                                break;
                            case "kubernetes":
                                if (inCI) {
                                    // show links to grafana and also we need to move the logs to artifacts
                                    const networkEndtime = new Date().getTime();
                                    for (const node of network.relay) {
                                        const loki_url = (0, utils_1.getLokiUrl)(network.namespace, node.name, network.networkStartTime, networkEndtime);
                                        console.log(`\t${utils_1.decorators.magenta(node.name)}: ${utils_1.decorators.green(loki_url)}`);
                                    }
                                    for (const [paraId, parachain] of Object.entries(network.paras)) {
                                        console.log(`\n\tParaId: ${utils_1.decorators.magenta(paraId)}`);
                                        for (const node of parachain.nodes) {
                                            const loki_url = (0, utils_1.getLokiUrl)(network.namespace, node.name, network.networkStartTime, networkEndtime);
                                            console.log(`\t\t${utils_1.decorators.magenta(node.name)}: ${utils_1.decorators.green(loki_url)}`);
                                        }
                                    }
                                    // logs are also collaected as artifacts
                                    console.log(`\n\n\t ${utils_1.decorators.yellow("📓 Logs are also available in the artifacts' pipeline in gitlab")}`);
                                }
                                else {
                                    console.log(`\n\t${utils_1.decorators.magenta(logsPath)}`);
                                }
                                break;
                        }
                    }
                }
                return;
            });
        });
        for (const assertion of testDef.assertions) {
            const generator = fns[assertion.parsed.fn];
            debug(generator);
            if (!generator) {
                console.log(`\n ${utils_1.decorators.red("Invalid fn generator:")} \t ${utils_1.decorators.bright(assertion.parsed.fn)}`);
                process.exit(1);
            }
            const testFn = generator(assertion.parsed.args);
            const test = new Test(assertion.original_line, () => __awaiter(this, void 0, void 0, function* () { return yield testFn(network, backchannelMap, configBasePath); }));
            suite.addTest(test);
            test.timeout(0);
        }
        // pass the file path, don't load the reporter as a module
        const resolvedReporterPath = path_1.default.resolve(__dirname, "./testReporter");
        mocha.reporter(resolvedReporterPath);
        // run
        mocha.run(exitMocha);
    });
}
exports.run = run;
// extracted from mocha test runner helper.
const exitMocha = (code) => {
    console.log("exit code", code);
    const clampedCode = Math.min(code, 255);
    let draining = 0;
    // Eagerly set the process's exit code in case stream.write doesn't
    // execute its callback before the process terminates.
    process.exitCode = clampedCode;
    // flush output for Node.js Windows pipe bug
    // https://github.com/joyent/node/issues/6247 is just one bug example
    // https://github.com/visionmedia/mocha/issues/333 has a good discussion
    const done = () => {
        if (!draining--) {
            process.exit(clampedCode);
        }
    };
    const streams = [process.stdout, process.stderr];
    streams.forEach((stream) => {
        // submit empty write request and wait for completion
        draining += 1;
        stream.write("", done);
    });
    done();
};
const fns = Object.assign(Object.assign({}, assertions_1.default), commands_1.default);
