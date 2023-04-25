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
exports.generateKeystoreFiles = exports.generateKeyForNode = exports.generateKeyFromSeed = void 0;
const api_1 = require("@polkadot/api");
const util_1 = require("@polkadot/util");
const util_crypto_1 = require("@polkadot/util-crypto");
const utils_1 = require("@zombienet/utils");
const fs_1 = __importDefault(require("fs"));
function nameCase(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
function generateKeyFromSeed(seed) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, util_crypto_1.cryptoWaitReady)();
        const sr_keyring = new api_1.Keyring({ type: "sr25519" });
        return sr_keyring.createFromUri(`//${seed}`);
    });
}
exports.generateKeyFromSeed = generateKeyFromSeed;
function generateKeyForNode(nodeName) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, util_crypto_1.cryptoWaitReady)();
        const mnemonic = (0, util_crypto_1.mnemonicGenerate)();
        const seed = nodeName
            ? `//${nameCase(nodeName)}`
            : (0, util_1.u8aToHex)((0, util_crypto_1.mnemonicToMiniSecret)(mnemonic));
        const sr_keyring = new api_1.Keyring({ type: "sr25519" });
        const sr_account = sr_keyring.createFromUri(`${seed}`);
        const sr_stash = sr_keyring.createFromUri(`${seed}//stash`);
        const ed_keyring = new api_1.Keyring({ type: "ed25519" });
        const ed_account = ed_keyring.createFromUri(`${seed}`);
        const ec_keyring = new api_1.Keyring({ type: "ecdsa" });
        const ec_account = ec_keyring.createFromUri(`${seed}`);
        // return the needed info
        return {
            seed,
            mnemonic,
            sr_account: {
                address: sr_account.address,
                publicKey: (0, util_1.u8aToHex)(sr_account.publicKey),
            },
            sr_stash: {
                address: sr_stash.address,
                publicKey: (0, util_1.u8aToHex)(sr_stash.publicKey),
            },
            ed_account: {
                address: ed_account.address,
                publicKey: (0, util_1.u8aToHex)(ed_account.publicKey),
            },
            ec_account: {
                publicKey: (0, util_1.u8aToHex)(ec_account.publicKey),
            },
        };
    });
}
exports.generateKeyForNode = generateKeyForNode;
function generateKeystoreFiles(node, path, isStatemint = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const keystoreDir = `${path}/keystore`;
        yield (0, utils_1.makeDir)(keystoreDir);
        const paths = [];
        const keysHash = {
            aura: isStatemint
                ? node.accounts.ed_account.publicKey
                : node.accounts.sr_account.publicKey,
            babe: node.accounts.sr_account.publicKey,
            imon: node.accounts.sr_account.publicKey,
            gran: node.accounts.ed_account.publicKey,
            audi: node.accounts.sr_account.publicKey,
            asgn: node.accounts.sr_account.publicKey,
            para: node.accounts.sr_account.publicKey,
            beef: node.accounts.ec_account.publicKey,
            nmbs: node.accounts.sr_account.publicKey,
            rand: node.accounts.sr_account.publicKey,
            rate: node.accounts.ed_account.publicKey, // Equilibrium rate module
        };
        for (const [k, v] of Object.entries(keysHash)) {
            const filename = Buffer.from(k).toString("hex") + v.replace(/^0x/, "");
            const keystoreFilePath = `${keystoreDir}/${filename}`;
            paths.push(keystoreFilePath);
            yield fs_1.default.promises.writeFile(keystoreFilePath, `"${node.accounts.seed}"`);
        }
        return paths;
    });
}
exports.generateKeystoreFiles = generateKeystoreFiles;
