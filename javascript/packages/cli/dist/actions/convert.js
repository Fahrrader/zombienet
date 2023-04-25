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
exports.convert = void 0;
const utils_1 = require("@zombienet/utils");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("../constants");
function convert(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!filePath) {
                throw Error("Path of configuration file was not provided");
            }
            const { baseName, config } = yield readPolkadotLaunchConfigFile(filePath);
            const convertedConfig = yield convertConfig(config);
            yield persistConfig(convertedConfig, baseName);
        }
        catch (err) {
            console.log(`\n ${utils_1.decorators.red("Error: ")} \t ${utils_1.decorators.bright(err)}\n`);
        }
    });
}
exports.convert = convert;
function readPolkadotLaunchConfigFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const extension = path_1.default.extname(filePath);
        const baseName = path_1.default.basename(filePath, extension);
        let config;
        if (extension === ".json") {
            config = JSON.parse(yield promises_1.default.readFile(filePath, "utf-8"));
        }
        else if (extension === ".js") {
            config = (yield Promise.resolve(`${path_1.default.resolve(filePath)}`).then(s => __importStar(require(s)))).config;
        }
        else {
            throw new Error("No valid extension was found.");
        }
        return { baseName, config };
    });
}
function convertConfig(config) {
    const relaychain = convertRelaychain(config.relaychain);
    const parachains = convertParachains(config.simpleParachains, config.parachains);
    const hrmpChannels = convertHrmpChannels(config.hrmpChannels);
    return {
        relaychain,
        parachains,
        hrmp_channels: hrmpChannels,
        types: config.types,
    };
}
function convertRelaychain(relaychain) {
    const { chain, genesis, nodes = [], bin } = relaychain;
    const convertedNodes = nodes.map((node) => ({
        name: node.name,
        args: node.flags,
        ws_port: node.wsPort,
        rpc_port: node.rpcPort,
        p2p_port: node.port,
        balance: constants_1.DEFAULT_BALANCE,
        validator: true,
        invulnerable: true,
    }));
    return {
        chain,
        default_command: bin,
        genesis,
        nodes: convertedNodes,
    };
}
function convertParachains(simpleParachains = [], parachains = []) {
    const convertedSimpleParachains = simpleParachains.map(convertSimpleParachain);
    const convertedParachains = parachains.map(convertParachain);
    return convertedSimpleParachains.concat(convertedParachains);
}
function convertSimpleParachain(simpleParachain) {
    const { id, balance, port, bin } = simpleParachain;
    const collator = {
        name: "alice",
        command: bin,
        p2p_port: +port,
        balance: +balance || constants_1.DEFAULT_BALANCE,
        validator: true,
        invulnerable: true,
    };
    return { id: +id, collators: [collator] };
}
function convertParachain(parachain) {
    const { id = "2000", balance, chain, nodes, bin } = parachain;
    const collators = nodes.map(({ name = "", flags, rpcPort, wsPort, port }) => ({
        name,
        command: bin,
        args: flags,
        ws_port: wsPort,
        rpc_port: rpcPort,
        p2p_port: port,
        balance: +balance || constants_1.DEFAULT_BALANCE,
        validator: true,
        invulnerable: true,
    }));
    return { id: +id, chain, collators };
}
function convertHrmpChannels(hrmpChannels) {
    return hrmpChannels.map(({ sender, recipient, maxCapacity, maxMessageSize }) => ({
        sender,
        recipient,
        max_capacity: maxCapacity,
        max_message_size: maxMessageSize,
    }));
}
function persistConfig(config, baseName) {
    return __awaiter(this, void 0, void 0, function* () {
        const content = JSON.stringify(config);
        const path = `${baseName}-zombienet.json`;
        yield promises_1.default.writeFile(path, content);
        console.log(`Converted JSON config exists now under: ${path}`);
    });
}
