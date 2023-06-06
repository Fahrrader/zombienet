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
exports.customizePlainRelayChain = exports.runCommandWithChainSpec = exports.getChainIdFromSpec = exports.isRawSpec = exports.writeChainSpec = exports.readAndParseChainSpec = exports.getRuntimeConfig = exports.addHrmpChannelsToGenesis = exports.addBootNodes = exports.changeGenesisConfig = exports.addParachainToGenesis = exports.generateNominators = exports.addGrandpaAuthority = exports.addAuraAuthority = exports.addParaCustom = exports.addCollatorSelection = exports.addStaking = exports.addAuthority = exports.getNodeKey = exports.addBalances = exports.clearAuthorities = exports.specHaveSessionsKeys = exports.destroyChainSpecProcesses = void 0;
const util_crypto_1 = require("@polkadot/util-crypto");
const utils_1 = require("@zombienet/utils");
const child_process_1 = require("child_process");
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const constants_1 = require("./constants");
const keys_1 = require("./keys");
const JSONbig = require("json-bigint")({ useNativeBigInt: true });
const debug = require("debug")("zombie::chain-spec");
const JSONStream = require("JSONStream");
// track 1st staking as default;
let stakingBond;
const processes = {};
// kill any runnning processes related to non-node chain spec processing
function destroyChainSpecProcesses() {
    return __awaiter(this, void 0, void 0, function* () {
        for (const key of Object.keys(processes)) {
            processes[key].kill();
        }
    });
}
exports.destroyChainSpecProcesses = destroyChainSpecProcesses;
// Check if the chainSpec have session keys
function specHaveSessionsKeys(chainSpec) {
    // Check runtime_genesis_config key for rococo compatibility.
    const runtimeConfig = getRuntimeConfig(chainSpec);
    return ((runtimeConfig === null || runtimeConfig === void 0 ? void 0 : runtimeConfig.session) ||
        (runtimeConfig === null || runtimeConfig === void 0 ? void 0 : runtimeConfig.palletSession) ||
        (runtimeConfig === null || runtimeConfig === void 0 ? void 0 : runtimeConfig.authorMapping));
}
exports.specHaveSessionsKeys = specHaveSessionsKeys;
// Get authority keys from within chainSpec data
function getAuthorityKeys(chainSpec, keyType = "session") {
    const runtimeConfig = getRuntimeConfig(chainSpec);
    switch (keyType) {
        case "session":
            if (runtimeConfig === null || runtimeConfig === void 0 ? void 0 : runtimeConfig.session)
                return runtimeConfig.session.keys;
            break;
        case "aura":
            if (runtimeConfig === null || runtimeConfig === void 0 ? void 0 : runtimeConfig.aura)
                return runtimeConfig.aura.authorities;
            break;
        case "grandpa":
            if (runtimeConfig === null || runtimeConfig === void 0 ? void 0 : runtimeConfig.grandpa)
                return runtimeConfig.grandpa.authorities;
            break;
    }
    const errorMsg = `⚠ ${keyType} keys not found in runtimeConfig`;
    console.error(`\n\t\t  ${utils_1.decorators.yellow(errorMsg)}`);
}
// Remove all existing keys from `session.keys` / aura.authorities / grandpa.authorities
function clearAuthorities(specPath) {
    try {
        const chainSpec = readAndParseChainSpec(specPath);
        const runtimeConfig = getRuntimeConfig(chainSpec);
        // clear keys
        if (runtimeConfig === null || runtimeConfig === void 0 ? void 0 : runtimeConfig.session)
            runtimeConfig.session.keys.length = 0;
        // clear aura
        if (runtimeConfig === null || runtimeConfig === void 0 ? void 0 : runtimeConfig.aura)
            runtimeConfig.aura.authorities.length = 0;
        // clear grandpa
        if (runtimeConfig === null || runtimeConfig === void 0 ? void 0 : runtimeConfig.grandpa)
            runtimeConfig.grandpa.authorities.length = 0;
        // clear collatorSelection
        if (runtimeConfig === null || runtimeConfig === void 0 ? void 0 : runtimeConfig.collatorSelection)
            runtimeConfig.collatorSelection.invulnerables = [];
        // Clear staking
        if (runtimeConfig === null || runtimeConfig === void 0 ? void 0 : runtimeConfig.staking) {
            stakingBond = runtimeConfig.staking.stakers[0][2];
            runtimeConfig.staking.stakers = [];
            runtimeConfig.staking.invulnerables = [];
            runtimeConfig.staking.validatorCount = 0;
        }
        writeChainSpec(specPath, chainSpec);
        const logTable = new utils_1.CreateLogTable({
            colWidths: [120],
        });
        logTable.pushToPrint([
            [utils_1.decorators.green("🧹 Starting with a fresh authority set...")],
        ]);
    }
    catch (err) {
        console.error(`\n${utils_1.decorators.red("Fail to clear authorities")}`);
        throw err;
    }
}
exports.clearAuthorities = clearAuthorities;
function addBalances(specPath, nodes) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const chainSpec = readAndParseChainSpec(specPath);
            const runtimeConfig = getRuntimeConfig(chainSpec);
            for (const node of nodes) {
                if (node.balance) {
                    const stash_key = node.accounts.sr_stash.address;
                    const balanceToAdd = stakingBond
                        ? node.validator && node.balance > stakingBond
                            ? node.balance
                            : stakingBond + 1
                        : node.balance;
                    runtimeConfig.balances.balances.push([stash_key, balanceToAdd]);
                    const logLine = `👤 Added Balance ${node.balance} for ${utils_1.decorators.green(node.name)} - ${utils_1.decorators.magenta(stash_key)}`;
                    new utils_1.CreateLogTable({
                        colWidths: [120],
                        doubleBorder: true,
                    }).pushToPrint([[logLine]]);
                }
            }
            writeChainSpec(specPath, chainSpec);
        }
        catch (err) {
            console.error(`\n${utils_1.decorators.red(`Fail to add balance for nodes: ${nodes}`)}`);
            throw err;
        }
    });
}
exports.addBalances = addBalances;
function getNodeKey(node, useStash = true) {
    try {
        const { sr_stash, sr_account, ed_account, ec_account } = node.accounts;
        const address = useStash ? sr_stash.address : sr_account.address;
        const key = [
            address,
            address,
            {
                grandpa: ed_account.address,
                babe: sr_account.address,
                im_online: sr_account.address,
                parachain_validator: sr_account.address,
                authority_discovery: sr_account.address,
                para_validator: sr_account.address,
                para_assignment: sr_account.address,
                beefy: (0, util_crypto_1.encodeAddress)(ec_account.publicKey),
                aura: sr_account.address,
                nimbus: sr_account.address,
            },
        ];
        return key;
    }
    catch (err) {
        console.error(`\n${utils_1.decorators.red(`Fail to generate key for node: ${node}`)}`);
        throw err;
    }
}
exports.getNodeKey = getNodeKey;
// Add additional authorities to chain spec in `session.keys`
function addAuthority(specPath, node, key) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const chainSpec = readAndParseChainSpec(specPath);
            const { sr_stash } = node.accounts;
            const keys = getAuthorityKeys(chainSpec);
            if (!keys)
                return;
            keys.push(key);
            new utils_1.CreateLogTable({
                colWidths: [30, 20, 70],
            }).pushToPrint([
                [
                    utils_1.decorators.cyan("👤 Added Genesis Authority"),
                    utils_1.decorators.green(node.name),
                    utils_1.decorators.magenta(sr_stash.address),
                ],
            ]);
            writeChainSpec(specPath, chainSpec);
        }
        catch (err) {
            console.error(`\n${utils_1.decorators.red(`Fail to add authority for node: ${node}`)}`);
            throw err;
        }
    });
}
exports.addAuthority = addAuthority;
/// Add node to staking
function addStaking(specPath, node) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const chainSpec = readAndParseChainSpec(specPath);
            const runtimeConfig = getRuntimeConfig(chainSpec);
            if (!(runtimeConfig === null || runtimeConfig === void 0 ? void 0 : runtimeConfig.staking))
                return;
            const { sr_stash } = node.accounts;
            runtimeConfig.staking.stakers.push([
                sr_stash.address,
                sr_stash.address,
                stakingBond || 1000000000000,
                "Validator",
            ]);
            runtimeConfig.staking.validatorCount += 1;
            // add to invulnerables
            if (node.invulnerable)
                runtimeConfig.staking.invulnerables.push(sr_stash.address);
            new utils_1.CreateLogTable({
                colWidths: [30, 20, 70],
            }).pushToPrint([
                [
                    utils_1.decorators.cyan("👤 Added Staking"),
                    utils_1.decorators.green(node.name),
                    utils_1.decorators.magenta(sr_stash.address),
                ],
            ]);
            writeChainSpec(specPath, chainSpec);
        }
        catch (err) {
            console.error(`\n${utils_1.decorators.red(`Fail to add staking for node: ${node}`)}`);
            throw err;
        }
    });
}
exports.addStaking = addStaking;
/// Add collators
function addCollatorSelection(specPath, node) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const chainSpec = readAndParseChainSpec(specPath);
            const runtimeConfig = getRuntimeConfig(chainSpec);
            if (!((_a = runtimeConfig === null || runtimeConfig === void 0 ? void 0 : runtimeConfig.collatorSelection) === null || _a === void 0 ? void 0 : _a.invulnerables))
                return;
            const { sr_account } = node.accounts;
            runtimeConfig.collatorSelection.invulnerables.push(sr_account.address);
            new utils_1.CreateLogTable({
                colWidths: [30, 20, 70],
            }).pushToPrint([
                [
                    utils_1.decorators.cyan("👤 Added CollatorSelection "),
                    utils_1.decorators.green(node.name),
                    utils_1.decorators.magenta(sr_account.address),
                ],
            ]);
            writeChainSpec(specPath, chainSpec);
        }
        catch (err) {
            console.error(`\n${utils_1.decorators.red(`Fail to add collator: ${node}`)}`);
            throw err;
        }
    });
}
exports.addCollatorSelection = addCollatorSelection;
function addParaCustom() {
    return __awaiter(this, void 0, void 0, function* () {
        /// noop
    });
}
exports.addParaCustom = addParaCustom;
function addAuraAuthority(specPath, name, accounts) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { sr_account } = accounts;
            const chainSpec = readAndParseChainSpec(specPath);
            const keys = getAuthorityKeys(chainSpec, "aura");
            if (!keys)
                return;
            keys.push(sr_account.address);
            writeChainSpec(specPath, chainSpec);
            new utils_1.CreateLogTable({
                colWidths: [30, 20, 70],
            }).pushToPrint([
                [
                    utils_1.decorators.cyan("👤 Added Genesis Authority"),
                    utils_1.decorators.green(name),
                    utils_1.decorators.magenta(sr_account.address),
                ],
            ]);
        }
        catch (err) {
            console.error(`\n${utils_1.decorators.red(`Fail to add Aura account for node: ${name}`)}`);
            throw err;
        }
    });
}
exports.addAuraAuthority = addAuraAuthority;
function addGrandpaAuthority(specPath, name, accounts) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { ed_account } = accounts;
            const chainSpec = readAndParseChainSpec(specPath);
            const keys = getAuthorityKeys(chainSpec, "grandpa");
            if (!keys)
                return;
            keys.push([ed_account.address, 1]);
            writeChainSpec(specPath, chainSpec);
            const logLine = `👤 Added Genesis Authority (GRANDPA) ${utils_1.decorators.green(name)} - ${utils_1.decorators.magenta(ed_account.address)}`;
            new utils_1.CreateLogTable({ colWidths: [120], doubleBorder: true }).pushToPrint([
                [logLine],
            ]);
        }
        catch (err) {
            console.error(`\n${utils_1.decorators.red(`Fail to add GrandPa account for node: ${name}`)}`);
            throw err;
        }
    });
}
exports.addGrandpaAuthority = addGrandpaAuthority;
function generateNominators(specPath, randomNominatorsCount, maxNominations, validators) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const chainSpec = readAndParseChainSpec(specPath);
            const runtimeConfig = getRuntimeConfig(chainSpec);
            if (!(runtimeConfig === null || runtimeConfig === void 0 ? void 0 : runtimeConfig.staking))
                return;
            let logLine = `👤 Generating random Nominators (${utils_1.decorators.green(randomNominatorsCount)})`;
            new utils_1.CreateLogTable({ colWidths: [120], doubleBorder: true }).pushToPrint([
                [logLine],
            ]);
            const maxForRandom = Math.pow(2, 48) - 1;
            for (let i = 0; i < randomNominatorsCount; i++) {
                // create account
                const nom = yield (0, keys_1.generateKeyFromSeed)(`nom-${i}`);
                // add to balances
                const balanceToAdd = stakingBond + 1;
                runtimeConfig.balances.balances.push([nom.address, balanceToAdd]);
                // random nominations
                const count = crypto_1.default.randomInt(maxForRandom) % maxNominations;
                const nominations = (0, utils_1.getRandom)(validators, count || count + 1);
                // push to stakers
                runtimeConfig.staking.stakers.push([
                    nom.address,
                    nom.address,
                    stakingBond,
                    {
                        Nominator: nominations,
                    },
                ]);
            }
            writeChainSpec(specPath, chainSpec);
            logLine = `👤 Added random Nominators (${utils_1.decorators.green(randomNominatorsCount)})`;
            new utils_1.CreateLogTable({ colWidths: [120], doubleBorder: true }).pushToPrint([
                [logLine],
            ]);
        }
        catch (err) {
            console.error(`\n${utils_1.decorators.red(`Fail to generate staking config with count : ${randomNominatorsCount} and max : ${maxNominations}`)}`);
            throw err;
        }
    });
}
exports.generateNominators = generateNominators;
// Add parachains to the chain spec at genesis.
function addParachainToGenesis(specPath, para_id, head, wasm, parachain = true) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const chainSpec = readAndParseChainSpec(specPath);
            const runtimeConfig = getRuntimeConfig(chainSpec);
            let paras = undefined;
            if (runtimeConfig.paras) {
                paras = runtimeConfig.paras.paras;
            }
            // For retro-compatibility with substrate pre Polkadot 0.9.5
            else if (runtimeConfig.parachainsParas) {
                paras = runtimeConfig.parachainsParas.paras;
            }
            if (paras) {
                const new_para = [
                    parseInt(para_id),
                    [(0, utils_1.readDataFile)(head), (0, utils_1.readDataFile)(wasm), parachain],
                ];
                paras.push(new_para);
                writeChainSpec(specPath, chainSpec);
                const logLine = `${utils_1.decorators.green("✓ Added Genesis Parachain")} ${para_id}`;
                new utils_1.CreateLogTable({ colWidths: [120], doubleBorder: true }).pushToPrint([
                    [logLine],
                ]);
            }
            else {
                console.error(`\n${utils_1.decorators.reverse(utils_1.decorators.red("  ⚠ paras not found in runtimeConfig"))}`);
                process.exit(1);
            }
        }
        catch (err) {
            console.error(`\n${utils_1.decorators.red(`Fail to add para: ${para_id} to genesis`)}`);
            throw err;
        }
    });
}
exports.addParachainToGenesis = addParachainToGenesis;
// Update the runtime config in the genesis.
// It will try to match keys which exist within the configuration and update the value.
function changeGenesisConfig(specPath, updates) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const chainSpec = readAndParseChainSpec(specPath);
            const msg = `⚙ Updating Chain Genesis Configuration (path: ${specPath})`;
            new utils_1.CreateLogTable({ colWidths: [120], doubleBorder: true }).pushToPrint([
                [`\n\t ${utils_1.decorators.green(msg)}`],
            ]);
            if (chainSpec.genesis) {
                const config = chainSpec.genesis;
                findAndReplaceConfig(updates, config);
                writeChainSpec(specPath, chainSpec);
            }
        }
        catch (err) {
            console.error(`\n${utils_1.decorators.red("Fail to customize genesis")}`);
            throw err;
        }
    });
}
exports.changeGenesisConfig = changeGenesisConfig;
function addBootNodes(specPath, addresses) {
    return __awaiter(this, void 0, void 0, function* () {
        let chainSpec;
        try {
            chainSpec = readAndParseChainSpec(specPath);
        }
        catch (e) {
            if (e.code !== "ERR_FS_FILE_TOO_LARGE")
                throw e;
            // can't customize bootnodes
            const logLine = ` 🚧 ${utils_1.decorators.yellow(`Chain Spec file ${specPath} is TOO LARGE to customize (more than 2G).`)} 🚧`;
            new utils_1.CreateLogTable({ colWidths: [120], doubleBorder: true }).pushToPrint([
                [logLine],
            ]);
            return;
        }
        // prevent dups bootnodes
        chainSpec.bootNodes = [...new Set(addresses)];
        writeChainSpec(specPath, chainSpec);
        const logTable = new utils_1.CreateLogTable({ colWidths: [120] });
        if (addresses.length) {
            logTable.pushToPrint([
                [`${utils_1.decorators.green(chainSpec.name)} ⚙ Added Boot Nodes`],
                [addresses.join("\n")],
            ]);
        }
        else {
            logTable.pushToPrint([
                [`${utils_1.decorators.green(chainSpec.name)} ⚙ Clear Boot Nodes`],
            ]);
        }
    });
}
exports.addBootNodes = addBootNodes;
function addHrmpChannelsToGenesis(specPath, hrmp_channels) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            new utils_1.CreateLogTable({ colWidths: [120], doubleBorder: true }).pushToPrint([
                [`\n\t ${utils_1.decorators.green("Adding Genesis HRMP Channels")}`],
            ]);
            const chainSpec = readAndParseChainSpec(specPath);
            for (const h of hrmp_channels) {
                const newHrmpChannel = [
                    h.sender,
                    h.recipient,
                    h.max_capacity,
                    h.max_message_size,
                ];
                const runtimeConfig = getRuntimeConfig(chainSpec);
                let hrmp = undefined;
                if (runtimeConfig.hrmp) {
                    hrmp = runtimeConfig.hrmp;
                }
                // For retro-compatibility with substrate pre Polkadot 0.9.5
                else if (runtimeConfig.parachainsHrmp) {
                    hrmp = runtimeConfig.parachainsHrmp;
                }
                if (hrmp && hrmp.preopenHrmpChannels) {
                    hrmp.preopenHrmpChannels.push(newHrmpChannel);
                    new utils_1.CreateLogTable({
                        colWidths: [120],
                        doubleBorder: true,
                    }).pushToPrint([
                        [
                            utils_1.decorators.green(`✓ Added HRMP channel ${h.sender} -> ${h.recipient}`),
                        ],
                    ]);
                }
                else {
                    console.error(`${utils_1.decorators.reverse(utils_1.decorators.red(`  ⚠ hrmp not found in runtimeConfig`))}`);
                    process.exit(1);
                }
                writeChainSpec(specPath, chainSpec);
            }
        }
        catch (err) {
            console.error(`\n${utils_1.decorators.red(`Fail to add hrmp channels: ${hrmp_channels}`)}`);
            throw err;
        }
    });
}
exports.addHrmpChannelsToGenesis = addHrmpChannelsToGenesis;
// Look at the key + values from `obj1` and try to replace them in `obj2`.
function findAndReplaceConfig(obj1, obj2) {
    // create new Object without null prototype
    const tempObj = Object.assign({}, obj2);
    // Look at keys of obj1
    Object.keys(obj1).forEach((key) => {
        // See if obj2 also has this key
        if (tempObj.hasOwnProperty(key)) {
            // If it goes deeper, recurse...
            if (obj1[key] !== null &&
                obj1[key] !== undefined &&
                JSON.parse(JSON.stringify(obj1[key])).constructor === Object) {
                findAndReplaceConfig(obj1[key], obj2[key]);
            }
            else {
                obj2[key] = obj1[key];
                new utils_1.CreateLogTable({
                    colWidths: [120],
                    doubleBorder: true,
                }).pushToPrint([
                    [
                        `${utils_1.decorators.green("✓ Updated Genesis Configuration")} [ key : ${key} ]`,
                    ],
                ]);
                debug(`[ ${key}: ${obj2[key]} ]`);
            }
        }
        else {
            console.error(`\n\t\t  ${utils_1.decorators.reverse(utils_1.decorators.red("⚠ Bad Genesis Configuration"))} [ ${key}: ${obj1[key]} ]`);
        }
    });
}
function getRuntimeConfig(chainSpec) {
    var _a;
    const runtimeConfig = ((_a = chainSpec.genesis.runtime) === null || _a === void 0 ? void 0 : _a.runtime_genesis_config) ||
        chainSpec.genesis.runtime;
    return runtimeConfig;
}
exports.getRuntimeConfig = getRuntimeConfig;
function readAndParseChainSpec(specPath) {
    const rawdata = fs_1.default.readFileSync(specPath);
    let chainSpec;
    try {
        chainSpec = JSONbig.parse(rawdata);
        return chainSpec;
    }
    catch (_a) {
        console.error(`\n\t\t  ${utils_1.decorators.red("  ⚠ failed to parse the chain spec")}`);
        process.exit(1);
    }
}
exports.readAndParseChainSpec = readAndParseChainSpec;
function writeChainSpec(specPath, chainSpec) {
    try {
        const data = JSONbig.stringify(chainSpec, null, 2);
        fs_1.default.writeFileSync(specPath, (0, utils_1.convertExponentials)(data));
    }
    catch (_a) {
        console.error(`\n\t\t  ${utils_1.decorators.reverse(utils_1.decorators.red("  ⚠ failed to write the chain spec with path: "))} ${specPath}`);
        process.exit(1);
    }
}
exports.writeChainSpec = writeChainSpec;
function isRawSpec(specPath) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((res) => {
            const stream = fs_1.default.createReadStream(specPath, { encoding: "utf8" });
            const parser = JSONStream.parse(["genesis", "raw", "top", /^0x/]);
            stream.pipe(parser);
            parser.on("data", (e) => {
                debug(`data: ${e}`);
                stream.destroy();
                return res(true);
            });
            stream.on("end", () => {
                return res(false);
            });
        });
    });
}
exports.isRawSpec = isRawSpec;
function getChainIdFromSpec(specPath) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((res) => {
            const stream = fs_1.default.createReadStream(specPath, { encoding: "utf8" });
            const parser = JSONStream.parse(["id"]);
            stream.pipe(parser);
            parser.on("data", (id) => {
                debug(`data: ${id}`);
                stream.destroy();
                return res(id);
            });
            stream.on("end", () => {
                return res("");
            });
        });
    });
}
exports.getChainIdFromSpec = getChainIdFromSpec;
function runCommandWithChainSpec(chainSpecFullPath, commandWithArgs, workingDirectory) {
    return __awaiter(this, void 0, void 0, function* () {
        const chainSpecSubstitutePattern = new RegExp((constants_1.RAW_CHAIN_SPEC_IN_CMD_PATTERN === null || constants_1.RAW_CHAIN_SPEC_IN_CMD_PATTERN === void 0 ? void 0 : constants_1.RAW_CHAIN_SPEC_IN_CMD_PATTERN.source) +
            "|" +
            (constants_1.PLAIN_CHAIN_SPEC_IN_CMD_PATTERN === null || constants_1.PLAIN_CHAIN_SPEC_IN_CMD_PATTERN === void 0 ? void 0 : constants_1.PLAIN_CHAIN_SPEC_IN_CMD_PATTERN.source), "gi");
        const substitutedCommandArgs = commandWithArgs.map((arg) => `${arg.replaceAll(chainSpecSubstitutePattern, chainSpecFullPath)}`);
        const chainSpecModifiedPath = chainSpecFullPath.replace(".json", "-modified.json");
        new utils_1.CreateLogTable({ colWidths: [30, 90] }).pushToPrint([
            [
                utils_1.decorators.green("🧪 Mutating chain spec"),
                utils_1.decorators.white(substitutedCommandArgs.join(" ")),
            ],
        ]);
        try {
            yield new Promise(function (resolve, reject) {
                if (processes["mutator"]) {
                    processes["mutator"].kill();
                }
                // spawn the chain spec mutator thread with the command and arguments
                processes["mutator"] = (0, child_process_1.spawn)(substitutedCommandArgs[0], substitutedCommandArgs.slice(1), { cwd: workingDirectory });
                // flush the modified spec to a different file and then copy it back into the original path
                const spec = fs_1.default.createWriteStream(chainSpecModifiedPath);
                // `pipe` since it deals with flushing and we need to guarantee that the data is flushed
                // before we resolve the promise.
                processes["mutator"].stdout.pipe(spec);
                processes["mutator"].stderr.pipe(process.stderr);
                processes["mutator"].on("close", (code) => {
                    if (code === 0) {
                        resolve();
                    }
                    else {
                        reject(new Error(`Process returned error code ${code}!`));
                    }
                });
                processes["mutator"].on("error", (err) => {
                    reject(err);
                });
            });
            // copy the modified file back into the original path after the mutation has completed
            fs_1.default.copyFileSync(chainSpecModifiedPath, chainSpecFullPath);
        }
        catch (e) {
            console.error(`\n${utils_1.decorators.red("Failed to mutate chain spec!")}`);
            throw e;
        }
    });
}
exports.runCommandWithChainSpec = runCommandWithChainSpec;
function customizePlainRelayChain(specPath, networkSpec) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Relay-chain spec customization logic
            const plainRelayChainSpec = readAndParseChainSpec(specPath);
            const keyType = specHaveSessionsKeys(plainRelayChainSpec)
                ? "session"
                : "aura";
            // make genesis overrides first.
            if (networkSpec.relaychain.genesis) {
                yield changeGenesisConfig(specPath, networkSpec.relaychain.genesis);
            }
            // Clear all defaults
            clearAuthorities(specPath);
            // add balances for nodes
            yield addBalances(specPath, networkSpec.relaychain.nodes);
            // add authorities for nodes
            const validatorKeys = [];
            for (const node of networkSpec.relaychain.nodes) {
                if (node.validator) {
                    validatorKeys.push(node.accounts.sr_stash.address);
                    if (keyType === "session") {
                        const key = getNodeKey(node);
                        yield addAuthority(specPath, node, key);
                    }
                    else {
                        yield addAuraAuthority(specPath, node.name, node.accounts);
                        yield addGrandpaAuthority(specPath, node.name, node.accounts);
                    }
                    yield addStaking(specPath, node);
                }
            }
            if (networkSpec.relaychain.randomNominatorsCount) {
                yield generateNominators(specPath, networkSpec.relaychain.randomNominatorsCount, networkSpec.relaychain.maxNominations, validatorKeys);
            }
            if (networkSpec.hrmp_channels) {
                yield addHrmpChannelsToGenesis(specPath, networkSpec.hrmp_channels);
            }
            // modify the plain chain spec with any custom commands
            for (const cmd of networkSpec.relaychain.chainSpecModifierCommands) {
                yield runCommandWithChainSpec(specPath, cmd, networkSpec.configBasePath);
            }
        }
        catch (err) {
            console.log(`\n ${utils_1.decorators.red("Unexpected error: ")} \t ${utils_1.decorators.bright(err)}\n`);
        }
    });
}
exports.customizePlainRelayChain = customizePlainRelayChain;
exports.default = {
    addAuraAuthority,
    addAuthority,
    changeGenesisConfig,
    clearAuthorities,
    readAndParseChainSpec,
    specHaveSessionsKeys,
    writeChainSpec,
    getNodeKey,
    addParaCustom,
    addCollatorSelection,
    isRawSpec,
    getChainIdFromSpec,
    customizePlainRelayChain,
};
