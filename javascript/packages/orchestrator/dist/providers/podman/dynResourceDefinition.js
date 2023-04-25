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
exports.createTempNodeDef = exports.replaceNetworkRef = exports.genNodeDef = exports.genTempoDef = exports.getIntrospectorDef = exports.genGrafanaDef = exports.genPrometheusDef = exports.genBootnodeDef = void 0;
const utils_1 = require("@zombienet/utils");
const configGenerator_1 = require("../../configGenerator");
const types_1 = require("../../types");
const client_1 = require("../client");
const resources_1 = require("./resources");
function genBootnodeDef(namespace, nodeSetup) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = (0, client_1.getClient)();
        const bootNodeResource = new resources_1.BootNodeResource(client, namespace, nodeSetup);
        const bootNodeResourceSpec = bootNodeResource.generateSpec();
        return bootNodeResourceSpec;
    });
}
exports.genBootnodeDef = genBootnodeDef;
function genPrometheusDef(namespace) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = (0, client_1.getClient)();
        const prometheusResource = new resources_1.PrometheusResource(client, namespace);
        const prometheusResourceSpec = prometheusResource.generateSpec();
        return prometheusResourceSpec;
    });
}
exports.genPrometheusDef = genPrometheusDef;
function genGrafanaDef(namespace, prometheusIp, tempoIp) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = (0, client_1.getClient)();
        const grafanaResource = new resources_1.GrafanaResource(client, namespace, prometheusIp, tempoIp);
        const grafanaResourceSpec = grafanaResource.generateSpec();
        return grafanaResourceSpec;
    });
}
exports.genGrafanaDef = genGrafanaDef;
function getIntrospectorDef(namespace, wsUri) {
    return __awaiter(this, void 0, void 0, function* () {
        const introspectorResource = new resources_1.IntrospectorResource(namespace, wsUri);
        const introspectorResourceSpec = introspectorResource.generateSpec();
        return introspectorResourceSpec;
    });
}
exports.getIntrospectorDef = getIntrospectorDef;
function genTempoDef(namespace) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = (0, client_1.getClient)();
        const tempoResource = new resources_1.TempoResource(client, namespace);
        const tempoResourceSpec = tempoResource.generateSpec();
        return tempoResourceSpec;
    });
}
exports.genTempoDef = genTempoDef;
function genNodeDef(namespace, nodeSetup) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = (0, client_1.getClient)();
        const nodeResource = new resources_1.NodeResource(client, namespace, nodeSetup);
        const nodeResourceSpec = nodeResource.generateSpec();
        return nodeResourceSpec;
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
