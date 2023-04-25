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
const constants_1 = require("../../constants");
const types_1 = require("../../types");
const resources_1 = require("./resources");
function genBootnodeDef(namespace, nodeSetup) {
    return __awaiter(this, void 0, void 0, function* () {
        const bootNodeResource = new resources_1.BootNodeResource(namespace, nodeSetup);
        return bootNodeResource.generateSpec();
    });
}
exports.genBootnodeDef = genBootnodeDef;
function genNodeDef(namespace, nodeSetup) {
    return __awaiter(this, void 0, void 0, function* () {
        const nodeResource = new resources_1.NodeResource(namespace, nodeSetup);
        return nodeResource.generateSpec();
    });
}
exports.genNodeDef = genNodeDef;
function replaceNetworkRef(podDef, network) {
    // replace command if needed in containers
    for (const container of podDef.spec.containers) {
        if (Array.isArray(container.command)) {
            const finalCommand = container.command.map((item) => network.replaceWithNetworInfo(item));
            container.command = finalCommand;
        }
        else {
            container.command = network.replaceWithNetworInfo(container.command);
        }
    }
}
exports.replaceNetworkRef = replaceNetworkRef;
function createTempNodeDef(name, image, chain, fullCommand) {
    return __awaiter(this, void 0, void 0, function* () {
        const nodeName = (0, configGenerator_1.getUniqueName)("temp");
        const node = {
            name: nodeName,
            key: (0, utils_1.getSha256)(nodeName),
            image,
            fullCommand: fullCommand + " && " + constants_1.TMP_DONE + " && " + constants_1.WAIT_UNTIL_SCRIPT_SUFIX,
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
