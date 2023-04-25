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
exports.createTempNodeDef = exports.replaceNetworkRef = exports.genNodeDef = exports.genBootnodeDef = void 0;
const utils_1 = require("@zombienet/utils");
const configGenerator_1 = require("../../configGenerator");
const types_1 = require("../../types");
const client_1 = require("../client");
const resources_1 = require("./resources");
function genBootnodeDef(namespace, nodeSetup) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = (0, client_1.getClient)();
        const bootNodeResource = new resources_1.BootNodeResource(client, namespace, nodeSetup);
        return bootNodeResource.generateSpec();
    });
}
exports.genBootnodeDef = genBootnodeDef;
function genNodeDef(namespace, nodeSetup) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = (0, client_1.getClient)();
        const nodeResource = new resources_1.NodeResource(client, namespace, nodeSetup);
        return nodeResource.generateSpec();
    });
}
exports.genNodeDef = genNodeDef;
function replaceNetworkRef(podDef, network) {
    // replace command if needed
    if (Array.isArray(podDef.spec.command)) {
        const finalCommand = podDef.spec.command.map((item) => network.replaceWithNetworInfo(item));
        podDef.spec.command = finalCommand;
    }
    else {
        // string
        podDef.spec.command = network.replaceWithNetworInfo(podDef.spec.command);
    }
}
exports.replaceNetworkRef = replaceNetworkRef;
function createTempNodeDef(name, image, chain, fullCommand) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = {
            name: (0, configGenerator_1.getUniqueName)("temp"),
            image,
            fullCommand: fullCommand,
            chain,
            validator: false,
            invulnerable: false,
            bootnodes: [],
            args: [],
            env: [],
            telemetryUrl: "",
            overrides: [],
            zombieRole: types_1.ZombieRole.Temp,
            p2pPort: yield (0, utils_1.getRandomPort)(),
            wsPort: yield (0, utils_1.getRandomPort)(),
            rpcPort: yield (0, utils_1.getRandomPort)(),
            prometheusPort: yield (0, utils_1.getRandomPort)(),
        };
        return node;
    });
}
exports.createTempNodeDef = createTempNodeDef;
