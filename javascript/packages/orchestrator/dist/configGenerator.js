"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.getFirstCollatorCommand = exports.getUniqueName = exports.generateBootnodeSpec = exports.generateNetworkSpec = exports.zombieWrapperPath = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importStar(require("path"));
const utils_1 = require("@zombienet/utils");
const constants_1 = require("./constants");
const keys_1 = require("./keys");
const paras_decorators_1 = require("./paras-decorators");
const types_1 = require("./types");
const debug = require("debug")("zombie::config-manager");
// get the path of the zombie wrapper
exports.zombieWrapperPath = (0, path_1.resolve)(__dirname, `../${constants_1.ZOMBIE_WRAPPER}`);
const DEFAULT_ENV = [
    { name: "COLORBT_SHOW_HIDDEN", value: "1" },
    { name: "RUST_BACKTRACE", value: "FULL" },
];
const isIterable = (obj) => {
    // checks for null and undefined
    if (obj == null || typeof obj == "string") {
        return false;
    }
    return typeof obj[Symbol.iterator] === "function";
};
const configurationFileChecks = (config) => {
    var _a, _b, _c, _d, _e;
    if (config.hrmpChannels) {
        throw new Error("'hrmpChannels' value the given configuration file is deprecated; Please use 'hrmp_channels' instead;");
    }
    (0, utils_1.validateImageUrl)(((_a = config === null || config === void 0 ? void 0 : config.relaychain) === null || _a === void 0 ? void 0 : _a.default_image) || constants_1.DEFAULT_IMAGE);
    if (((_b = config === null || config === void 0 ? void 0 : config.relaychain) === null || _b === void 0 ? void 0 : _b.node_groups) &&
        isIterable((_c = config === null || config === void 0 ? void 0 : config.relaychain) === null || _c === void 0 ? void 0 : _c.node_groups))
        for (const nodeGroup of ((_d = config === null || config === void 0 ? void 0 : config.relaychain) === null || _d === void 0 ? void 0 : _d.node_groups) || []) {
            (0, utils_1.validateImageUrl)((nodeGroup === null || nodeGroup === void 0 ? void 0 : nodeGroup.image) || (config === null || config === void 0 ? void 0 : config.relaychain.default_image) || constants_1.DEFAULT_IMAGE);
        }
    if ((config === null || config === void 0 ? void 0 : config.parachains) && isIterable(config === null || config === void 0 ? void 0 : config.parachains))
        for (const parachain of config.parachains) {
            if ((parachain === null || parachain === void 0 ? void 0 : parachain.collator_groups) && isIterable(parachain === null || parachain === void 0 ? void 0 : parachain.collator_groups))
                for (const collatorGroup of (parachain === null || parachain === void 0 ? void 0 : parachain.collator_groups) || []) {
                    (0, utils_1.validateImageUrl)((collatorGroup === null || collatorGroup === void 0 ? void 0 : collatorGroup.image) ||
                        ((_e = config === null || config === void 0 ? void 0 : config.relaychain) === null || _e === void 0 ? void 0 : _e.default_image) ||
                        constants_1.DEFAULT_COLLATOR_IMAGE);
                }
            if ((parachain === null || parachain === void 0 ? void 0 : parachain.collators) && isIterable(parachain === null || parachain === void 0 ? void 0 : parachain.collators))
                for (const collatorConfig of (parachain === null || parachain === void 0 ? void 0 : parachain.collators) || []) {
                    (0, utils_1.validateImageUrl)((collatorConfig === null || collatorConfig === void 0 ? void 0 : collatorConfig.image) || constants_1.DEFAULT_COLLATOR_IMAGE);
                }
        }
};
function generateNetworkSpec(config) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        let globalOverrides = [];
        if (config.relaychain.default_overrides) {
            globalOverrides = yield Promise.all(config.relaychain.default_overrides.map((override) => __awaiter(this, void 0, void 0, function* () {
                const valid_local_path = yield getLocalOverridePath(config.configBasePath, override.local_path);
                return {
                    local_path: valid_local_path,
                    remote_name: override.remote_name,
                };
            })));
        }
        const networkSpec = {
            configBasePath: config.configBasePath,
            relaychain: {
                defaultImage: config.relaychain.default_image || constants_1.DEFAULT_IMAGE,
                defaultCommand: config.relaychain.default_command || constants_1.DEFAULT_COMMAND,
                defaultArgs: config.relaychain.default_args || [],
                chainSpecModifierCommands: [],
                rawChainSpecModifierCommands: [],
                randomNominatorsCount: ((_a = config.relaychain) === null || _a === void 0 ? void 0 : _a.random_nominators_count) || 0,
                maxNominations: ((_b = config.relaychain) === null || _b === void 0 ? void 0 : _b.max_nominations) || constants_1.DEFAULT_MAX_NOMINATIONS,
                nodes: [],
                chain: config.relaychain.chain || constants_1.DEFAULT_CHAIN,
                overrides: globalOverrides,
                defaultResources: config.relaychain.default_resources,
            },
            parachains: [],
        };
        // check all imageURLs for validity
        // TODO: These checks should be agains all config items that needs check
        configurationFileChecks(config);
        if (config.relaychain.genesis)
            networkSpec.relaychain.genesis = config.relaychain.genesis;
        const chainName = config.relaychain.chain || constants_1.DEFAULT_CHAIN;
        if (config.relaychain.default_db_snapshot)
            networkSpec.relaychain.defaultDbSnapshot =
                config.relaychain.default_db_snapshot;
        // settings
        networkSpec.settings = Object.assign({ timeout: constants_1.DEFAULT_GLOBAL_TIMEOUT, enable_tracing: true }, (config.settings ? config.settings : {}));
        // default provider
        if (!networkSpec.settings.provider)
            networkSpec.settings.provider = "kubernetes";
        // if we don't have a path to the chain-spec leave undefined to create
        if (config.relaychain.chain_spec_path) {
            const chainSpecPath = (0, path_1.resolve)(process.cwd(), config.relaychain.chain_spec_path);
            if (!fs_1.default.existsSync(chainSpecPath)) {
                console.error(utils_1.decorators.red(`Genesis spec provided does not exist: ${chainSpecPath}`));
                process.exit();
            }
            else {
                networkSpec.relaychain.chainSpecPath = chainSpecPath;
            }
        }
        else {
            // Create the chain spec
            networkSpec.relaychain.chainSpecCommand = config.relaychain
                .chain_spec_command
                ? config.relaychain.chain_spec_command
                : constants_1.DEFAULT_CHAIN_SPEC_COMMAND.replace("{{chainName}}", networkSpec.relaychain.chain).replace("{{DEFAULT_COMMAND}}", networkSpec.relaychain.defaultCommand);
        }
        for (const cmd of config.relaychain.chain_spec_modifier_commands || []) {
            const cmdHasRawSpec = cmd.some((arg) => constants_1.RAW_CHAIN_SPEC_IN_CMD_PATTERN.test(arg));
            const cmdHasPlainSpec = cmd.some((arg) => constants_1.PLAIN_CHAIN_SPEC_IN_CMD_PATTERN.test(arg));
            if (cmdHasRawSpec && cmdHasPlainSpec) {
                console.log(utils_1.decorators.yellow(`Chain spec modifier command references both raw and plain chain specs! Only the raw chain spec will be modified.\n\t${cmd}`));
            }
            if (cmdHasRawSpec) {
                networkSpec.relaychain.rawChainSpecModifierCommands.push(cmd);
            }
            else if (cmdHasPlainSpec) {
                networkSpec.relaychain.chainSpecModifierCommands.push(cmd);
            }
            else {
                console.log(utils_1.decorators.yellow(`Chain spec modifier command does not attempt to reference a chain spec path! It will not be executed.\n\t${cmd}`));
            }
        }
        const relayChainBootnodes = [];
        for (const node of config.relaychain.nodes || []) {
            const nodeSetup = yield getNodeFromConfig(networkSpec, node, relayChainBootnodes, globalOverrides, node.name);
            networkSpec.relaychain.nodes.push(nodeSetup);
        }
        for (const nodeGroup of config.relaychain.node_groups || []) {
            for (let i = 0; i < nodeGroup.count; i++) {
                const node = {
                    name: `${nodeGroup.name}-${i}`,
                    image: nodeGroup.image || networkSpec.relaychain.defaultImage,
                    command: nodeGroup.command,
                    args: sanitizeArgs(nodeGroup.args || []),
                    validator: true,
                    invulnerable: false,
                    balance: constants_1.DEFAULT_BALANCE,
                    env: nodeGroup.env,
                    overrides: nodeGroup.overrides,
                    resources: nodeGroup.resources || networkSpec.relaychain.defaultResources,
                    db_snapshot: nodeGroup.db_snapshot,
                };
                const nodeSetup = yield getNodeFromConfig(networkSpec, node, relayChainBootnodes, globalOverrides, nodeGroup.name);
                networkSpec.relaychain.nodes.push(nodeSetup);
            }
        }
        if (networkSpec.relaychain.nodes.length < 1) {
            throw new Error("No NODE defined in config, please review.");
        }
        if (config.parachains && config.parachains.length) {
            for (const parachain of config.parachains) {
                const para = (0, paras_decorators_1.whichPara)(parachain.chain || "");
                let computedStatePath, computedStateCommand, computedWasmPath, computedWasmCommand;
                const bootnodes = relayChainBootnodes;
                // parachain_relaychain
                const paraChainName = (parachain.chain ? parachain.chain + "_" : "") + chainName;
                // IF is defined use that value
                // else check if the command is one off undying/adder otherwise true
                const isCumulusBased = parachain.cumulus_based !== undefined
                    ? parachain.cumulus_based
                    : ![constants_1.DEFAULT_ADDER_COLLATOR_BIN, constants_1.UNDYING_COLLATOR_BIN].includes(getFirstCollatorCommand(parachain));
                // collator could by defined in groups or
                // just using one collator definiton
                const collators = [];
                const collatorConfigs = parachain.collator ? [parachain.collator] : [];
                if (parachain.collators)
                    collatorConfigs.push(...parachain.collators);
                for (const collatorConfig of collatorConfigs) {
                    collators.push(yield getCollatorNodeFromConfig(networkSpec, collatorConfig, parachain.id, paraChainName, para, bootnodes, isCumulusBased));
                }
                for (const collatorGroup of parachain.collator_groups || []) {
                    for (let i = 0; i < collatorGroup.count; i++) {
                        const node = {
                            name: `${collatorGroup.name}-${i}`,
                            image: collatorGroup.image || constants_1.DEFAULT_COLLATOR_IMAGE,
                            command: collatorGroup.command || constants_1.DEFAULT_CUMULUS_COLLATOR_BIN,
                            args: sanitizeArgs(collatorGroup.args || [], { "listen-addr": 2 }),
                            validator: true,
                            invulnerable: false,
                            balance: constants_1.DEFAULT_BALANCE,
                            env: collatorGroup.env,
                            overrides: collatorGroup.overrides,
                            resources: collatorGroup.resources ||
                                networkSpec.relaychain.defaultResources,
                        };
                        collators.push(yield getCollatorNodeFromConfig(networkSpec, node, parachain.id, paraChainName, para, bootnodes, isCumulusBased));
                    }
                }
                // use the first collator for state/wasm generation
                const firstCollator = collators[0];
                if (!firstCollator)
                    throw new Error(`No Collator defined for parachain ${parachain.id}, please review.`);
                const collatorBinary = firstCollator.commandWithArgs
                    ? firstCollator.commandWithArgs.split(" ")[0]
                    : firstCollator.command || constants_1.DEFAULT_CUMULUS_COLLATOR_BIN;
                if (parachain.genesis_state_path) {
                    const genesisStatePath = (0, path_1.resolve)(process.cwd(), parachain.genesis_state_path);
                    if (!fs_1.default.existsSync(genesisStatePath)) {
                        console.error(utils_1.decorators.red(`Genesis spec provided does not exist: ${genesisStatePath}`));
                        process.exit();
                    }
                    else {
                        computedStatePath = genesisStatePath;
                    }
                }
                else {
                    computedStateCommand = parachain.genesis_state_generator
                        ? parachain.genesis_state_generator
                        : `${collatorBinary} ${constants_1.DEFAULT_GENESIS_GENERATE_SUBCOMMAND}`;
                    computedStateCommand += ` > {{CLIENT_REMOTE_DIR}}/${constants_1.GENESIS_STATE_FILENAME}`;
                }
                if (parachain.genesis_wasm_path) {
                    const genesisWasmPath = (0, path_1.resolve)(process.cwd(), parachain.genesis_wasm_path);
                    if (!fs_1.default.existsSync(genesisWasmPath)) {
                        console.error(utils_1.decorators.red(`Genesis spec provided does not exist: ${genesisWasmPath}`));
                        process.exit();
                    }
                    else {
                        computedWasmPath = genesisWasmPath;
                    }
                }
                else {
                    computedWasmCommand = parachain.genesis_wasm_generator
                        ? parachain.genesis_wasm_generator
                        : `${collatorBinary} ${constants_1.DEFAULT_WASM_GENERATE_SUBCOMMAND}`;
                    computedWasmCommand += ` > {{CLIENT_REMOTE_DIR}}/${constants_1.GENESIS_WASM_FILENAME}`;
                }
                let parachainSetup = {
                    id: parachain.id,
                    name: getUniqueName(parachain.id.toString()),
                    para,
                    cumulusBased: isCumulusBased,
                    chainSpecModifierCommands: [],
                    rawChainSpecModifierCommands: [],
                    addToGenesis: parachain.add_to_genesis === undefined
                        ? true
                        : parachain.add_to_genesis,
                    registerPara: parachain.register_para === undefined
                        ? true
                        : parachain.register_para,
                    onboardAsParachain: parachain.onboard_as_parachain !== undefined
                        ? parachain.onboard_as_parachain
                        : true,
                    collators,
                };
                if (parachain.chain)
                    parachainSetup.chain = parachain.chain;
                // if we don't have a path to the chain-spec leave undefined to create
                if (parachain.chain_spec_path) {
                    const chainSpecPath = (0, path_1.resolve)(process.cwd(), parachain.chain_spec_path);
                    if (!fs_1.default.existsSync(chainSpecPath)) {
                        console.error(utils_1.decorators.red(`Chain spec provided for parachain id: ${parachain.id} does not exist: ${chainSpecPath}`));
                        process.exit();
                    }
                    else {
                        parachainSetup.chainSpecPath = chainSpecPath;
                    }
                }
                for (const cmd of parachain.chain_spec_modifier_commands || []) {
                    const cmdHasRawSpec = cmd.some((arg) => constants_1.RAW_CHAIN_SPEC_IN_CMD_PATTERN.test(arg));
                    const cmdHasPlainSpec = cmd.some((arg) => constants_1.PLAIN_CHAIN_SPEC_IN_CMD_PATTERN.test(arg));
                    if (cmdHasRawSpec && cmdHasPlainSpec) {
                        console.log(utils_1.decorators.yellow(`Chain spec modifier command references both raw and plain chain specs! Only the raw chain spec will be modified.\n\t${cmd}`));
                    }
                    if (cmdHasRawSpec) {
                        parachainSetup.rawChainSpecModifierCommands.push(cmd);
                    }
                    else if (cmdHasPlainSpec) {
                        parachainSetup.chainSpecModifierCommands.push(cmd);
                    }
                    else {
                        console.log(utils_1.decorators.yellow(`Chain spec modifier command does not attempt to reference a chain spec path! It will not be executed.\n\t${cmd}`));
                    }
                }
                parachainSetup = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, parachainSetup), (parachain.balance ? { balance: parachain.balance } : {})), (computedWasmPath ? { genesisWasmPath: computedWasmPath } : {})), (computedWasmCommand
                    ? { genesisWasmGenerator: computedWasmCommand }
                    : {})), (computedStatePath ? { genesisStatePath: computedStatePath } : {})), (computedStateCommand
                    ? { genesisStateGenerator: computedStateCommand }
                    : {})), (parachain.genesis ? { genesis: parachain.genesis } : {}));
                networkSpec.parachains.push(parachainSetup);
            }
        }
        networkSpec.types = config.types ? config.types : {};
        if (config.hrmp_channels)
            networkSpec.hrmp_channels = config.hrmp_channels;
        return networkSpec;
    });
}
exports.generateNetworkSpec = generateNetworkSpec;
// TODO: move this fn to other module.
function generateBootnodeSpec(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const provider = config.settings.provider;
        const ports = yield getPorts(provider, {});
        const externalPorts = yield getExternalPorts(provider, ports, {});
        const nodeSetup = Object.assign(Object.assign({ name: "bootnode", key: "0000000000000000000000000000000000000000000000000000000000000001", command: config.relaychain.defaultCommand || constants_1.DEFAULT_COMMAND, image: config.relaychain.defaultImage || constants_1.DEFAULT_IMAGE, chain: config.relaychain.chain, validator: false, invulnerable: false, args: [
                "--ws-external",
                "--rpc-external",
                "--listen-addr",
                "/ip4/0.0.0.0/tcp/30333/ws",
            ], env: [], bootnodes: [], telemetryUrl: "", prometheus: true, overrides: [], zombieRole: types_1.ZombieRole.BootNode, imagePullPolicy: config.settings.image_pull_policy || "Always" }, ports), { externalPorts });
        return nodeSetup;
    });
}
exports.generateBootnodeSpec = generateBootnodeSpec;
const mUsedNames = {};
function getUniqueName(name) {
    let uniqueName;
    if (!mUsedNames[name]) {
        mUsedNames[name] = 1;
        uniqueName = name;
    }
    else {
        uniqueName = `${name}-${mUsedNames[name]}`;
        mUsedNames[name] += 1;
    }
    return uniqueName;
}
exports.getUniqueName = getUniqueName;
function getLocalOverridePath(configBasePath, definedLocalPath) {
    return __awaiter(this, void 0, void 0, function* () {
        // let check if local_path is full or relative
        let local_real_path = definedLocalPath;
        if (!fs_1.default.existsSync(definedLocalPath)) {
            // check relative to config
            local_real_path = path_1.default.join(configBasePath, definedLocalPath);
            if (!fs_1.default.existsSync(local_real_path))
                throw new Error("Invalid override config, only fullpaths or relative paths (from the config) are allowed");
        }
        return local_real_path;
    });
}
function getCollatorNodeFromConfig(networkSpec, collatorConfig, para_id, chain, // relay-chain
para, bootnodes, // parachain bootnodes
cumulusBased) {
    return __awaiter(this, void 0, void 0, function* () {
        let args = [];
        if (collatorConfig.args)
            args = args.concat(sanitizeArgs(collatorConfig.args, { "listen-addr": 2 }));
        const env = collatorConfig.env
            ? DEFAULT_ENV.concat(collatorConfig.env)
            : DEFAULT_ENV;
        const collatorBinary = collatorConfig.command_with_args
            ? collatorConfig.command_with_args.split(" ")[0]
            : collatorConfig.command || constants_1.DEFAULT_CUMULUS_COLLATOR_BIN;
        const collatorName = getUniqueName(collatorConfig.name || "collator");
        const [decoratedKeysGenerator] = (0, paras_decorators_1.decorate)(para, [keys_1.generateKeyForNode]);
        const accountsForNode = yield decoratedKeysGenerator(collatorName);
        const provider = networkSpec.settings.provider;
        const ports = yield getPorts(provider, collatorConfig);
        const externalPorts = yield getExternalPorts(provider, ports, collatorConfig);
        const node = Object.assign(Object.assign({ name: collatorName, key: (0, utils_1.getSha256)(collatorName), accounts: accountsForNode, validator: collatorConfig.validator !== false ? true : false, invulnerable: collatorConfig.invulnerable, balance: collatorConfig.balance, image: collatorConfig.image || constants_1.DEFAULT_COLLATOR_IMAGE, command: collatorBinary, commandWithArgs: collatorConfig.command_with_args, args: args || [], chain,
            bootnodes,
            env, telemetryUrl: "", prometheus: prometheusExternal(networkSpec), overrides: [], zombieRole: cumulusBased ? types_1.ZombieRole.CumulusCollator : types_1.ZombieRole.Collator, parachainId: para_id, dbSnapshot: collatorConfig.db_snapshot, imagePullPolicy: networkSpec.settings.image_pull_policy || "Always" }, ports), { externalPorts, p2pCertHash: collatorConfig.p2p_cert_hash });
        return node;
    });
}
function getNodeFromConfig(networkSpec, node, relayChainBootnodes, globalOverrides, group) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const command = node.command
            ? node.command
            : networkSpec.relaychain.defaultCommand;
        const image = node.image || networkSpec.relaychain.defaultImage;
        let args = sanitizeArgs(networkSpec.relaychain.defaultArgs || []);
        if (node.args)
            args = args.concat(sanitizeArgs(node.args));
        const uniqueArgs = [...new Set(args)];
        const env = node.env ? DEFAULT_ENV.concat(node.env) : DEFAULT_ENV;
        let nodeOverrides = [];
        if (node.overrides) {
            nodeOverrides = yield Promise.all(node.overrides.map((override) => __awaiter(this, void 0, void 0, function* () {
                const valid_local_path = yield getLocalOverridePath(networkSpec.configBasePath, override.local_path);
                return {
                    local_path: valid_local_path,
                    remote_name: override.remote_name,
                };
            })));
        }
        // by default nodes are validators except for those
        // set explicit to not be validators.
        const isValidator = node.validator !== false;
        const nodeName = getUniqueName(node.name);
        const accountsForNode = yield (0, keys_1.generateKeyForNode)(nodeName);
        const provider = networkSpec.settings.provider;
        const ports = yield getPorts(provider, node);
        const externalPorts = yield getExternalPorts(provider, ports, node);
        // build node Setup
        const nodeSetup = Object.assign(Object.assign({ name: nodeName, key: (0, utils_1.getSha256)(nodeName), accounts: accountsForNode, command: command || constants_1.DEFAULT_COMMAND, commandWithArgs: node.command_with_args, image: image || constants_1.DEFAULT_IMAGE, chain: networkSpec.relaychain.chain, validator: isValidator, invulnerable: node.invulnerable, balance: node.balance, args: uniqueArgs, env, bootnodes: relayChainBootnodes, telemetryUrl: ((_a = networkSpec.settings) === null || _a === void 0 ? void 0 : _a.telemetry)
                ? "ws://telemetry:8000/submit 0"
                : "", telemetry: ((_b = networkSpec.settings) === null || _b === void 0 ? void 0 : _b.telemetry) ? true : false, prometheus: prometheusExternal(networkSpec), overrides: [...globalOverrides, ...nodeOverrides], addToBootnodes: node.add_to_bootnodes ? true : false, resources: node.resources || networkSpec.relaychain.defaultResources, zombieRole: types_1.ZombieRole.Node, imagePullPolicy: networkSpec.settings.image_pull_policy || "Always" }, ports), { externalPorts, p2pCertHash: node.p2p_cert_hash });
        if (group)
            nodeSetup.group = group;
        const dbSnapshot = node.db_snapshot
            ? node.db_snapshot
            : networkSpec.relaychain.defaultDbSnapshot || null;
        if (dbSnapshot)
            nodeSetup.dbSnapshot = dbSnapshot;
        return nodeSetup;
    });
}
function sanitizeArgs(args, extraArgsToRemove = {}) {
    // Do NOT filter any argument to the internal full-node of the collator
    const augmentedArgsToRemove = Object.assign(Object.assign({}, constants_1.ARGS_TO_REMOVE), extraArgsToRemove);
    let removeNext = false;
    const separatorIndex = args.indexOf("--");
    const filteredArgs = args
        .slice(0, separatorIndex >= 0 ? separatorIndex : args.length)
        .filter((arg) => {
        if (removeNext) {
            removeNext = false;
            return false;
        }
        const argParsed = arg === "-d" ? "d" : arg.replace(/--/g, "");
        if (augmentedArgsToRemove[argParsed]) {
            if (augmentedArgsToRemove[argParsed] === 2)
                removeNext = true;
            return false;
        }
        else {
            return true;
        }
    });
    return filteredArgs;
}
function getPorts(provider, nodeSetup) {
    return __awaiter(this, void 0, void 0, function* () {
        let ports = constants_1.DEFAULT_PORTS;
        if (provider === "native") {
            ports = {
                p2pPort: nodeSetup.p2p_port || (yield (0, utils_1.getRandomPort)()),
                wsPort: nodeSetup.ws_port || (yield (0, utils_1.getRandomPort)()),
                rpcPort: nodeSetup.rpc_port || (yield (0, utils_1.getRandomPort)()),
                prometheusPort: nodeSetup.prometheus_port || (yield (0, utils_1.getRandomPort)()),
            };
        }
        return ports;
    });
}
function getExternalPorts(provider, processPorts, nodeSetup) {
    return __awaiter(this, void 0, void 0, function* () {
        if (provider === "native")
            return processPorts;
        const ports = {
            p2pPort: nodeSetup.p2p_port || (yield (0, utils_1.getRandomPort)()),
            wsPort: nodeSetup.ws_port || (yield (0, utils_1.getRandomPort)()),
            rpcPort: nodeSetup.rpc_port || (yield (0, utils_1.getRandomPort)()),
            prometheusPort: nodeSetup.prometheus_port || (yield (0, utils_1.getRandomPort)()),
        };
        return ports;
    });
}
// enable --prometheus-external by default
// TODO: fix the `any` to an actual interface
const prometheusExternal = (networkSpec) => {
    var _a;
    return ((_a = networkSpec.settings) === null || _a === void 0 ? void 0 : _a.prometheus) !== undefined
        ? networkSpec.settings.prometheus
        : true;
};
function getFirstCollatorCommand(parachain) {
    var _a, _b;
    let cmd;
    if (parachain.collator) {
        cmd = parachain.collator.command_with_args || parachain.collator.command;
    }
    else if ((_a = parachain.collators) === null || _a === void 0 ? void 0 : _a.length) {
        cmd =
            parachain.collators[0].command_with_args ||
                parachain.collators[0].command;
    }
    else if ((_b = parachain.collator_groups) === null || _b === void 0 ? void 0 : _b.length) {
        cmd = parachain.collator_groups[0].command;
    }
    cmd = cmd || constants_1.DEFAULT_CUMULUS_COLLATOR_BIN; // no command defined we use the default polkadot-parachain.
    debug(`cmd is ${cmd}`);
    cmd = cmd.split(" ")[0];
    return cmd.split("/").pop();
}
exports.getFirstCollatorCommand = getFirstCollatorCommand;
