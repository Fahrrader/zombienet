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
exports.getNodeKey = void 0;
const api_1 = require("@polkadot/api");
const util_1 = require("@polkadot/util");
const util_crypto_1 = require("@polkadot/util-crypto");
const utils_1 = require("@zombienet/utils");
const chainSpec_1 = require("../chainSpec");
const keys_1 = require("../keys");
// track 1st staking as default;
let paraStakingBond;
const KNOWN_MOONBEAM_KEYS = {
    alith: "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133",
    baltathar: "0x8075991ce870b93a8870eca0c0f91913d12f47948ca0fd25b49c6fa7cdbeee8b",
    charleth: "0x0b6e18cafb6ed99687ec547bd28139cafdd2bffe70e6b688025de6b445aa5c5b",
    dorothy: "0x39539ab1876910bbf3a223d84a29e28f1cb4e2e456503e7e91ed39b2e7223d68",
    ethan: "0x7dce9bc8babb68fec1409be38c8e1a52650206a7ed90ff956ae8a6d15eeaaef4",
    faith: "0xb9d2ea9a615f3165812e8d44de0d24da9bbd164b65c4f0573e1ce2c8dbd9c8df",
    goliath: "0x96b8a38e12e1a31dee1eab2fffdf9d9990045f5b37e44d8cc27766ef294acf18",
    heath: "0x0d6dcaaef49272a5411896be8ad16c01c35d6f8c18873387b71fbc734759b0ab",
    ida: "0x4c42532034540267bf568198ccec4cb822a025da542861fcb146a5fab6433ff8",
    judith: "0x94c49300a58d576011096bcb006aa06f5a91b34b4383891e8029c21dc39fbb8b",
};
function specHaveSessionsKeys(chainSpec) {
    var _a;
    const keys = (0, chainSpec_1.specHaveSessionsKeys)(chainSpec);
    return keys || ((_a = (0, chainSpec_1.getRuntimeConfig)(chainSpec)) === null || _a === void 0 ? void 0 : _a.authorMapping);
}
function getAuthorityKeys(chainSpec) {
    var _a, _b;
    return (_b = (_a = (0, chainSpec_1.getRuntimeConfig)(chainSpec)) === null || _a === void 0 ? void 0 : _a.authorMapping) === null || _b === void 0 ? void 0 : _b.mappings;
}
function addAuthority(specPath, node, key) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const chainSpec = (0, chainSpec_1.readAndParseChainSpec)(specPath);
        const { sr_account } = node.accounts;
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
                utils_1.decorators.magenta(sr_account.address),
            ],
        ]);
        ((_c = (_b = (_a = chainSpec === null || chainSpec === void 0 ? void 0 : chainSpec.genesis) === null || _a === void 0 ? void 0 : _a.runtime) === null || _b === void 0 ? void 0 : _b.authorMapping) === null || _c === void 0 ? void 0 : _c.mappings) &&
            new utils_1.CreateLogTable({
                colWidths: [20, 50, 50],
            }).pushToPrint(chainSpec.genesis.runtime.authorMapping.mappings.map((map) => [
                utils_1.decorators.cyan("mapping"),
                ...map,
            ]));
        (0, chainSpec_1.writeChainSpec)(specPath, chainSpec);
    });
}
function clearAuthorities(specPath) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, chainSpec_1.clearAuthorities)(specPath);
        const chainSpec = (0, chainSpec_1.readAndParseChainSpec)(specPath);
        const runtimeConfig = (0, chainSpec_1.getRuntimeConfig)(chainSpec);
        // clear authorMapping
        if (runtimeConfig === null || runtimeConfig === void 0 ? void 0 : runtimeConfig.authorMapping)
            runtimeConfig.authorMapping.mappings.length = 0;
        // clear parachainStaking
        if (runtimeConfig === null || runtimeConfig === void 0 ? void 0 : runtimeConfig.parachainStaking) {
            paraStakingBond = runtimeConfig.parachainStaking.candidates[0][1];
            runtimeConfig.parachainStaking.candidates.length = 0;
            runtimeConfig.parachainStaking.delegations.length = 0;
        }
        (0, chainSpec_1.writeChainSpec)(specPath, chainSpec);
    });
}
function generateKeyForNode(nodeName) {
    return __awaiter(this, void 0, void 0, function* () {
        const keys = yield (0, keys_1.generateKeyForNode)(nodeName);
        yield (0, util_crypto_1.cryptoWaitReady)();
        const eth_keyring = new api_1.Keyring({ type: "ethereum" });
        const eth_account = eth_keyring.createFromUri(nodeName && nodeName.toLocaleLowerCase() in KNOWN_MOONBEAM_KEYS
            ? KNOWN_MOONBEAM_KEYS[nodeName.toLocaleLowerCase()]
            : `${keys.mnemonic}/m/44'/60'/0'/0/0`);
        keys.eth_account = {
            address: eth_account.address,
            publicKey: (0, util_1.u8aToHex)(eth_account.publicKey),
        };
        return keys;
    });
}
function getNodeKey(node) {
    const { sr_account, eth_account } = node.accounts;
    return [sr_account.address, eth_account.address];
}
exports.getNodeKey = getNodeKey;
function addParaCustom(specPath, node) {
    return __awaiter(this, void 0, void 0, function* () {
        const chainSpec = (0, chainSpec_1.readAndParseChainSpec)(specPath);
        const runtimeConfig = (0, chainSpec_1.getRuntimeConfig)(chainSpec);
        // parachainStaking
        if (!(runtimeConfig === null || runtimeConfig === void 0 ? void 0 : runtimeConfig.parachainStaking))
            return;
        const { eth_account } = node.accounts;
        runtimeConfig.parachainStaking.candidates.push([
            eth_account.address,
            paraStakingBond || 1000000000000,
        ]);
        (0, chainSpec_1.writeChainSpec)(specPath, chainSpec);
    });
}
function getProcessStartTimeKey() {
    return "moonbeam_substrate_process_start_time_seconds";
}
exports.default = {
    specHaveSessionsKeys,
    addAuthority,
    clearAuthorities,
    generateKeyForNode,
    addParaCustom,
    getAuthorityKeys,
    getNodeKey,
    getProcessStartTimeKey,
};
