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
exports.NodeResource = void 0;
const utils_1 = require("@zombienet/utils");
const cmdGenerator_1 = require("../../../cmdGenerator");
const constants_1 = require("../../../constants");
const types_1 = require("../../../types");
class NodeResource {
    constructor(client, namespace, nodeSetupConfig) {
        this.namespace = namespace;
        this.nodeSetupConfig = nodeSetupConfig;
        const nodeRootPath = `${client.tmpDir}/${this.nodeSetupConfig.name}`;
        this.configPath = `${nodeRootPath}/cfg`;
        this.dataPath = `${nodeRootPath}/data`;
        this.relayDataPath = `${nodeRootPath}/relay-data`;
    }
    generateSpec() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.createDirectories();
            const ports = yield this.generatePorts();
            const command = yield this.generateCommand();
            const zombieRoleLabel = this.getZombieRoleLabel();
            const env = this.getEnv();
            const nodeManifest = this.generateNodeSpec(ports, command, zombieRoleLabel, env);
            return nodeManifest;
        });
    }
    createDirectories() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield (0, utils_1.makeDir)(this.configPath, true);
                yield (0, utils_1.makeDir)(this.dataPath, true);
                yield (0, utils_1.makeDir)(this.relayDataPath, true);
            }
            catch (_a) {
                throw new Error(`Error generating directories for ${this.nodeSetupConfig.name} resource`);
            }
        });
    }
    portFromNodeSetupConfigOrDefault(portProperty) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.nodeSetupConfig[portProperty]) {
                return this.nodeSetupConfig[portProperty];
            }
            return (0, utils_1.getRandomPort)();
        });
    }
    generatePorts() {
        return __awaiter(this, void 0, void 0, function* () {
            return [
                {
                    containerPort: constants_1.PROMETHEUS_PORT,
                    name: "prometheus",
                    flag: "--prometheus-port",
                    hostPort: yield this.portFromNodeSetupConfigOrDefault("prometheusPort"),
                },
                {
                    containerPort: constants_1.RPC_HTTP_PORT,
                    name: "rpc",
                    flag: "--rpc-port",
                    hostPort: yield this.portFromNodeSetupConfigOrDefault("rpcPort"),
                },
                {
                    containerPort: constants_1.RPC_WS_PORT,
                    name: "rpc-ws",
                    flag: "--ws-port",
                    hostPort: yield this.portFromNodeSetupConfigOrDefault("wsPort"),
                },
                {
                    containerPort: constants_1.P2P_PORT,
                    name: "p2p",
                    flag: "--port",
                    hostPort: yield this.portFromNodeSetupConfigOrDefault("p2pPort"),
                },
            ];
        });
    }
    generateCommand() {
        if (this.nodeSetupConfig.zombieRole === types_1.ZombieRole.CumulusCollator) {
            return (0, cmdGenerator_1.genCumulusCollatorCmd)(this.nodeSetupConfig, this.configPath, this.dataPath, this.relayDataPath, false);
        }
        return (0, cmdGenerator_1.genCmd)(this.nodeSetupConfig, this.configPath, this.dataPath, false);
    }
    getZombieRoleLabel() {
        const { zombieRole, validator } = this.nodeSetupConfig;
        if (zombieRole)
            return zombieRole;
        return validator ? "authority" : "full-node";
    }
    getEnv() {
        const { env } = this.nodeSetupConfig;
        return env.reduce((memo, item) => {
            memo[item.name] = item.value;
            return memo;
        }, {});
    }
    generateNodeSpec(ports, command, zombieRole, env) {
        return {
            metadata: {
                name: this.nodeSetupConfig.name,
                namespace: this.namespace,
                labels: {
                    "zombie-role": zombieRole,
                    app: "zombienet",
                    "zombie-ns": this.namespace,
                    name: this.namespace,
                    instance: this.nodeSetupConfig.name,
                },
            },
            spec: {
                cfgPath: this.configPath,
                dataPath: this.dataPath,
                ports,
                command,
                env,
            },
        };
    }
}
exports.NodeResource = NodeResource;
