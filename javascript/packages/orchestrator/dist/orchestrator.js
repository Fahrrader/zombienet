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
exports.test = exports.start = void 0;
const utils_1 = require("@zombienet/utils");
const fs_1 = __importDefault(require("fs"));
const tmp_promise_1 = __importDefault(require("tmp-promise"));
const chainSpec_1 = require("./chainSpec");
const configGenerator_1 = require("./configGenerator");
const constants_1 = require("./constants");
const jsapi_helpers_1 = require("./jsapi-helpers");
const network_1 = require("./network");
const paras_1 = require("./paras");
const providers_1 = require("./providers/");
const instrospector_1 = require("./network-helpers/instrospector");
const tracing_collator_1 = require("./network-helpers/tracing-collator");
const verifier_1 = require("./network-helpers/verifier");
const spawner_1 = require("./spawner");
const debug = require("debug")("zombie");
// Hide some warning messages that are coming from Polkadot JS API.
// TODO: Make configurable.
(0, utils_1.filterConsole)([
    `code: '1006' reason: 'connection failed'`,
    `API-WS: disconnected`,
]);
function start(credentials, launchConfig, options) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const opts = Object.assign({ monitor: false, spawnConcurrency: 1, inCI: false, silent: true }, options);
        (0, utils_1.setSilent)(opts.silent);
        let network;
        let cronInterval = undefined;
        try {
            // Parse and build Network definition
            const networkSpec = yield (0, configGenerator_1.generateNetworkSpec)(launchConfig);
            debug(JSON.stringify(networkSpec, null, 4));
            const { initClient, setupChainSpec, getChainSpecRaw } = (0, providers_1.getProvider)(networkSpec.settings.provider);
            // global timeout to spin the network
            const timeoutTimer = setTimeout(() => {
                if (network && !network.launched) {
                    throw new Error(`GLOBAL TIMEOUT (${networkSpec.settings.timeout} secs) `);
                }
            }, networkSpec.settings.timeout * 1000);
            // set namespace
            const randomBytes = networkSpec.settings.provider === "podman" ? 4 : 16;
            const namespace = `zombie-${(0, utils_1.generateNamespace)(randomBytes)}`;
            // get user defined types
            const userDefinedTypes = (0, utils_1.loadTypeDef)(networkSpec.types);
            // use provided dir (and make some validations) or create tmp directory to store needed files
            const tmpDir = opts.dir
                ? { path: opts.dir }
                : yield tmp_promise_1.default.dir({ prefix: `${namespace}_` });
            // If custom path is provided then create it
            if (opts.dir) {
                if (!fs_1.default.existsSync(opts.dir)) {
                    fs_1.default.mkdirSync(opts.dir);
                }
                else if (!opts.force) {
                    const response = yield (0, utils_1.askQuestion)(utils_1.decorators.yellow("Directory already exists; \nDo you want to continue? (y/N)"));
                    if (response.toLowerCase() !== "y") {
                        console.log("Exiting...");
                        process.exit(1);
                    }
                }
            }
            const localMagicFilepath = `${tmpDir.path}/finished.txt`;
            // Create MAGIC file to stop temp/init containers
            fs_1.default.openSync(localMagicFilepath, "w");
            // Define chain name and file name to use.
            const chainSpecFileName = `${networkSpec.relaychain.chain}.json`;
            const chainName = networkSpec.relaychain.chain;
            const chainSpecFullPath = `${tmpDir.path}/${chainSpecFileName}`;
            const chainSpecFullPathPlain = chainSpecFullPath.replace(".json", "-plain.json");
            const client = initClient(credentials, namespace, tmpDir.path);
            if (networkSpec.settings.node_spawn_timeout)
                client.timeout = networkSpec.settings.node_spawn_timeout;
            network = new network_1.Network(client, namespace, tmpDir.path);
            const zombieTable = new utils_1.CreateLogTable({
                head: [
                    utils_1.decorators.green("🧟 Zombienet 🧟"),
                    utils_1.decorators.green("Initiation"),
                ],
                colWidths: [20, 100],
                doubleBorder: true,
            });
            zombieTable.pushTo([
                [
                    utils_1.decorators.green("Provider"),
                    utils_1.decorators.blue(networkSpec.settings.provider),
                ],
                [utils_1.decorators.green("Namespace"), namespace],
                [utils_1.decorators.green("Temp Dir"), tmpDir.path],
            ]);
            zombieTable.print();
            debug(`\t Launching network under namespace: ${namespace}`);
            // validate access to cluster
            const isValid = yield client.validateAccess();
            if (!isValid) {
                console.error(`\n\t\t ${utils_1.decorators.reverse(utils_1.decorators.red("⚠ Can not access"))} ${utils_1.decorators.magenta(networkSpec.settings.provider)}, please check your config.`);
                process.exit(1);
            }
            const zombieWrapperLocalPath = `${tmpDir.path}/${constants_1.ZOMBIE_WRAPPER}`;
            const zombieWrapperContent = yield fs_1.default.promises.readFile(configGenerator_1.zombieWrapperPath);
            yield fs_1.default.promises.writeFile(zombieWrapperLocalPath, zombieWrapperContent
                .toString()
                .replace("{{REMOTE_DIR}}", client.remoteDir), {
                mode: 0o755,
            });
            // create namespace
            yield client.createNamespace();
            // setup cleaner
            if (!opts.monitor) {
                cronInterval = yield client.setupCleaner();
                debug("Cleanner job configured");
            }
            // Create bootnode and backchannel services
            debug(`Creating static resources (bootnode and backchannel services)`);
            yield client.staticSetup(networkSpec.settings);
            yield client.createPodMonitor("pod-monitor.yaml", chainName);
            // create or copy relay chain spec
            yield setupChainSpec(namespace, networkSpec.relaychain, chainName, chainSpecFullPathPlain);
            // check if we have the chain spec file
            if (!fs_1.default.existsSync(chainSpecFullPathPlain))
                throw new Error("Can't find chain spec file!");
            // Check if the chain spec is in raw format
            // Could be if the chain_spec_path was set
            const chainSpecContent = (0, chainSpec_1.readAndParseChainSpec)(chainSpecFullPathPlain);
            const relayChainSpecIsRaw = Boolean((_a = chainSpecContent.genesis) === null || _a === void 0 ? void 0 : _a.raw);
            network.chainId = chainSpecContent.id;
            const parachainFilesPromiseGenerator = (parachain) => __awaiter(this, void 0, void 0, function* () {
                const parachainFilesPath = `${tmpDir.path}/${parachain.name}`;
                yield (0, utils_1.makeDir)(parachainFilesPath);
                yield (0, paras_1.generateParachainFiles)(namespace, tmpDir.path, parachainFilesPath, networkSpec.configBasePath, chainName, parachain, relayChainSpecIsRaw);
            });
            const parachainPromiseGenerators = networkSpec.parachains.map((parachain) => {
                return () => parachainFilesPromiseGenerator(parachain);
            });
            yield (0, utils_1.series)(parachainPromiseGenerators, opts.spawnConcurrency);
            for (const parachain of networkSpec.parachains) {
                const parachainFilesPath = `${tmpDir.path}/${parachain.name}`;
                const stateLocalFilePath = `${parachainFilesPath}/${constants_1.GENESIS_STATE_FILENAME}`;
                const wasmLocalFilePath = `${parachainFilesPath}/${constants_1.GENESIS_WASM_FILENAME}`;
                if (parachain.addToGenesis && !relayChainSpecIsRaw)
                    yield (0, chainSpec_1.addParachainToGenesis)(chainSpecFullPathPlain, parachain.id.toString(), stateLocalFilePath, wasmLocalFilePath);
            }
            if (!relayChainSpecIsRaw) {
                yield (0, chainSpec_1.customizePlainRelayChain)(chainSpecFullPathPlain, networkSpec);
                // generate the raw chain spec
                yield getChainSpecRaw(namespace, networkSpec.relaychain.defaultImage, chainName, networkSpec.relaychain.defaultCommand, chainSpecFullPath);
            }
            else {
                console.log(`\n\t\t 🚧 ${utils_1.decorators.yellow("Chain Spec was set to a file in raw format, can't customize.")} 🚧`);
                yield fs_1.default.promises.copyFile(chainSpecFullPathPlain, chainSpecFullPath);
            }
            // ensure chain raw is ok
            try {
                const chainSpecContent = (0, chainSpec_1.readAndParseChainSpec)(chainSpecFullPathPlain);
                debug(`Chain name: ${chainSpecContent.name}`);
                new utils_1.CreateLogTable({ colWidths: [120], doubleBorder: true }).pushToPrint([
                    [`Chain name: ${utils_1.decorators.green(chainSpecContent.name)}`],
                ]);
            }
            catch (err) {
                console.log(`\n ${utils_1.decorators.red("Unexpected error: ")} \t ${utils_1.decorators.bright(err)}\n`);
                throw new Error(`${utils_1.decorators.red(`Error:`)} \t ${utils_1.decorators.bright(` chain-spec raw file at ${chainSpecFullPath} is not a valid JSON`)}`);
            }
            // clear bootnodes
            yield (0, chainSpec_1.addBootNodes)(chainSpecFullPath, []);
            // store the chain spec path to use in tests
            network.chainSpecFullPath = chainSpecFullPath;
            // files to include in each node
            const filesToCopyToNodes = [
                {
                    localFilePath: chainSpecFullPath,
                    remoteFilePath: `${client.remoteDir}/${chainSpecFileName}`,
                },
                {
                    localFilePath: zombieWrapperLocalPath,
                    remoteFilePath: `${client.remoteDir}/${constants_1.ZOMBIE_WRAPPER}`,
                },
            ];
            const bootnodes = [];
            if (launchConfig.settings.bootnode) {
                const bootnodeSpec = yield (0, configGenerator_1.generateBootnodeSpec)(networkSpec);
                networkSpec.relaychain.nodes.unshift(bootnodeSpec);
            }
            // modify the raw chain spec with any custom commands
            for (const cmd of networkSpec.relaychain.rawChainSpecModifierCommands) {
                yield (0, chainSpec_1.runCommandWithChainSpec)(chainSpecFullPath, cmd, networkSpec.configBasePath);
            }
            const monitorIsAvailable = yield client.isPodMonitorAvailable();
            let jaegerUrl = undefined;
            if (networkSpec.settings.enable_tracing) {
                switch (client.providerName) {
                    case "kubernetes":
                        if (networkSpec.settings.jaeger_agent)
                            jaegerUrl = networkSpec.settings.jaeger_agent;
                        break;
                    case "podman":
                        jaegerUrl = `${yield client.getNodeIP("tempo")}:6831`;
                        break;
                }
                if (process.env.ZOMBIE_JAEGER_URL)
                    jaegerUrl = process.env.ZOMBIE_JAEGER_URL;
            }
            const spawnOpts = {
                silent: opts.silent,
                inCI: opts.inCI,
                monitorIsAvailable,
                userDefinedTypes,
                jaegerUrl,
                local_ip: networkSpec.settings.local_ip,
            };
            const firstNode = networkSpec.relaychain.nodes.shift();
            if (firstNode) {
                const nodeMultiAddress = yield (0, spawner_1.spawnNode)(client, firstNode, network, bootnodes, filesToCopyToNodes, spawnOpts);
                yield (0, utils_1.sleep)(2000);
                // add bootnodes to chain spec
                bootnodes.push(nodeMultiAddress);
                yield (0, chainSpec_1.addBootNodes)(chainSpecFullPath, bootnodes);
                if (client.providerName === "kubernetes") {
                    // cache the chainSpec with bootnodes
                    const fileBuffer = yield fs_1.default.promises.readFile(chainSpecFullPath);
                    const fileHash = (0, utils_1.getSha256)(fileBuffer.toString());
                    const parts = chainSpecFullPath.split("/");
                    const fileName = parts[parts.length - 1];
                    yield client.uploadToFileserver(chainSpecFullPath, fileName, fileHash);
                }
            }
            const promiseGenerators = networkSpec.relaychain.nodes.map((node) => {
                return () => (0, spawner_1.spawnNode)(client, node, network, bootnodes, filesToCopyToNodes, spawnOpts);
            });
            yield (0, utils_1.series)(promiseGenerators, opts.spawnConcurrency);
            // TODO: handle `addToBootnodes` in a diff serie.
            // for (const node of networkSpec.relaychain.nodes) {
            //   if (node.addToBootnodes) {
            //     bootnodes.push(network.getNodeByName(node.name).multiAddress);
            //     await addBootNodes(chainSpecFullPath, bootnodes);
            //   }
            // }
            new utils_1.CreateLogTable({ colWidths: [120], doubleBorder: true }).pushToPrint([
                [utils_1.decorators.green("All relay chain nodes spawned...")],
            ]);
            debug("\t All relay chain nodes spawned...");
            const collatorPromiseGenerators = [];
            for (const parachain of networkSpec.parachains) {
                if (!parachain.addToGenesis && parachain.registerPara) {
                    // register parachain on a running network
                    const basePath = `${tmpDir.path}/${parachain.name}`;
                    yield (0, jsapi_helpers_1.registerParachain)({
                        id: parachain.id,
                        wasmPath: `${basePath}/${constants_1.GENESIS_WASM_FILENAME}`,
                        statePath: `${basePath}/${constants_1.GENESIS_STATE_FILENAME}`,
                        apiUrl: network.relay[0].wsUri,
                        onboardAsParachain: parachain.onboardAsParachain,
                    });
                }
                if (parachain.cumulusBased) {
                    const firstCollatorNode = parachain.collators.shift();
                    if (firstCollatorNode) {
                        const collatorMultiAddress = yield (0, spawner_1.spawnNode)(client, firstCollatorNode, network, [], filesToCopyToNodes, spawnOpts, parachain);
                        yield (0, utils_1.sleep)(2000);
                        // add bootnodes to chain spec
                        yield (0, chainSpec_1.addBootNodes)(parachain.specPath, [collatorMultiAddress]);
                    }
                }
                collatorPromiseGenerators.push(...parachain.collators.map((node) => {
                    return () => (0, spawner_1.spawnNode)(client, node, network, [], filesToCopyToNodes, spawnOpts, parachain);
                }));
            }
            // launch all collator in series
            yield (0, utils_1.series)(collatorPromiseGenerators, opts.spawnConcurrency);
            // spawn polkadot-introspector if is enable and IFF provider is
            // podman or kubernetes
            if (networkSpec.settings.polkadot_introspector &&
                ["podman", "kubernetes"].includes(client.providerName)) {
                const introspectorNetworkNode = yield (0, instrospector_1.spawnIntrospector)(client, network.relay[0], options === null || options === void 0 ? void 0 : options.inCI);
                network.addNode(introspectorNetworkNode, network_1.Scope.COMPANION);
            }
            // Set `tracing_collator` config to the network if is available.
            yield (0, tracing_collator_1.setTracingCollatorConfig)(networkSpec, network, client);
            // sleep to give time to last node process' to start
            yield (0, utils_1.sleep)(2 * 1000);
            yield (0, verifier_1.verifyNodes)(network);
            // cleanup global timeout
            network.launched = true;
            clearTimeout(timeoutTimer);
            debug(`\t 🚀 LAUNCH COMPLETE under namespace ${utils_1.decorators.green(namespace)} 🚀`);
            yield fs_1.default.promises.writeFile(`${tmpDir.path}/zombie.json`, JSON.stringify(network));
            return network;
        }
        catch (error) {
            let errDetails;
            if (((_b = error === null || error === void 0 ? void 0 : error.stderr) === null || _b === void 0 ? void 0 : _b.includes(utils_1.POLKADOT_NOT_FOUND)) ||
                ((_c = error === null || error === void 0 ? void 0 : error.stderr) === null || _c === void 0 ? void 0 : _c.includes(utils_1.PARACHAIN_NOT_FOUND))) {
                errDetails = utils_1.POLKADOT_NOT_FOUND_DESCRIPTION;
            }
            console.log(`${utils_1.decorators.red("Error: ")} \t ${utils_1.decorators.bright(error)}\n\n${utils_1.decorators.magenta(errDetails)}`);
            if (network) {
                yield network.dumpLogs();
                yield network.stop();
            }
            if (cronInterval)
                clearInterval(cronInterval);
            process.exit(1);
        }
    });
}
exports.start = start;
function test(credentials, networkConfig, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        let network;
        try {
            network = yield start(credentials, networkConfig, { force: true });
            yield cb(network);
        }
        catch (error) {
            console.log(`\n ${utils_1.decorators.red("Error: ")} \t ${utils_1.decorators.bright(error)}\n`);
        }
        finally {
            if (network) {
                yield network.dumpLogs();
                yield network.stop();
            }
        }
    });
}
exports.test = test;
