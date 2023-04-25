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
        const nodeRootPath = `${client.tmpDir}/${nodeSetupConfig.name}`;
        this.configPath = `${nodeRootPath}/cfg`;
        this.dataPath = `${nodeRootPath}/data`;
        this.relayDataPath = `${nodeRootPath}/relay-data`;
    }
    generateSpec() {
        return __awaiter(this, void 0, void 0, function* () {
            const volumes = yield this.generateVolumes();
            const volumeMounts = this.generateVolumesMounts();
            const containersPorts = yield this.generateContainersPorts();
            const containers = yield this.generateContainers(volumeMounts, containersPorts);
            return this.generatePodSpec(containers, volumes);
        });
    }
    createVolumeDirectories() {
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
    generateVolumes() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.createVolumeDirectories();
            return [
                {
                    name: "tmp-cfg",
                    hostPath: { type: "Directory", path: this.configPath },
                },
                {
                    name: "tmp-data",
                    hostPath: { type: "Directory", path: this.dataPath },
                },
                {
                    name: "tmp-relay-data",
                    hostPath: { type: "Directory", path: this.relayDataPath },
                },
            ];
        });
    }
    generateVolumesMounts() {
        return [
            {
                name: "tmp-cfg",
                mountPath: "/cfg:U",
                readOnly: false,
            },
            {
                name: "tmp-data",
                mountPath: "/data:U",
                readOnly: false,
            },
            {
                name: "tmp-relay-data",
                mountPath: "/relay-data:U",
                readOnly: false,
            },
        ];
    }
    portFromNodeSetupConfigOrDefault(portProperty) {
        return __awaiter(this, void 0, void 0, function* () {
            const { externalPorts } = this.nodeSetupConfig;
            if (externalPorts && portProperty in externalPorts) {
                return externalPorts[portProperty];
            }
            return (0, utils_1.getRandomPort)();
        });
    }
    generateContainersPorts() {
        return __awaiter(this, void 0, void 0, function* () {
            return [
                {
                    containerPort: constants_1.PROMETHEUS_PORT,
                    name: "prometheus",
                    hostPort: yield this.portFromNodeSetupConfigOrDefault("prometheusPort"),
                },
                {
                    containerPort: constants_1.RPC_HTTP_PORT,
                    name: "rpc",
                    hostPort: yield this.portFromNodeSetupConfigOrDefault("rpcPort"),
                },
                {
                    containerPort: constants_1.RPC_WS_PORT,
                    name: "rpc-ws",
                    hostPort: yield this.portFromNodeSetupConfigOrDefault("wsPort"),
                },
                {
                    containerPort: constants_1.P2P_PORT,
                    name: "p2p",
                    hostPort: yield this.portFromNodeSetupConfigOrDefault("p2pPort"),
                },
            ];
        });
    }
    generateContainerCommand() {
        if (this.nodeSetupConfig.zombieRole === types_1.ZombieRole.CumulusCollator) {
            return (0, cmdGenerator_1.genCumulusCollatorCmd)(this.nodeSetupConfig);
        }
        return (0, cmdGenerator_1.genCmd)(this.nodeSetupConfig);
    }
    generateContainers(volumeMounts, ports) {
        return __awaiter(this, void 0, void 0, function* () {
            return [
                {
                    image: this.nodeSetupConfig.image,
                    name: this.nodeSetupConfig.name,
                    imagePullPolicy: "Always",
                    env: this.nodeSetupConfig.env,
                    volumeMounts,
                    ports,
                    command: yield this.generateContainerCommand(),
                },
            ];
        });
    }
    generatePodSpec(containers, volumes) {
        const { name, validator } = this.nodeSetupConfig;
        return {
            apiVersion: "v1",
            kind: "Pod",
            metadata: {
                name: name,
                namespace: this.namespace,
                labels: {
                    "zombie-role": validator ? "authority" : "full-node",
                    app: "zombienet",
                    "zombie-ns": this.namespace,
                },
                annotations: {
                    "prometheus.io/scrape": "true",
                    "prometheus.io/port": `${constants_1.PROMETHEUS_PORT}`,
                },
            },
            spec: {
                hostname: name,
                initContainers: [],
                restartPolicy: "OnFailure",
                volumes,
                containers,
            },
        };
    }
}
exports.NodeResource = NodeResource;
