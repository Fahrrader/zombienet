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
exports.PrometheusResource = void 0;
const utils_1 = require("@zombienet/utils");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class PrometheusResource {
    constructor(client, namespace) {
        this.namespace = namespace;
        const nodeRootPath = `${client.tmpDir}/prometheus`;
        this.configPath = `${nodeRootPath}/etc`;
        this.dataPath = `${nodeRootPath}/data`;
    }
    generateSpec() {
        return __awaiter(this, void 0, void 0, function* () {
            const volumes = yield this.generateVolumes();
            const volumeMounts = this.generateVolumesMounts();
            const containersPorts = yield this.generateContainersPorts();
            const containers = this.generateContainers(volumeMounts, containersPorts);
            return this.generatePodSpec(containers, volumes);
        });
    }
    createVolumeDirectories() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield (0, utils_1.makeDir)(this.configPath, true);
                yield (0, utils_1.makeDir)(this.dataPath, true);
            }
            catch (_a) {
                throw new Error("Error creating directories for prometheus resource");
            }
        });
    }
    generatePrometheusConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const templateConfigPath = path_1.default.resolve(__dirname, "./configs/prometheus.yml");
                yield promises_1.default.writeFile(`${this.configPath}/prometheus.yml`, templateConfigPath);
            }
            catch (_a) {
                throw new Error("Error generating config for prometheus resource");
            }
        });
    }
    generateVolumes() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.createVolumeDirectories();
            yield this.generatePrometheusConfig();
            return [
                {
                    name: "prom-cfg",
                    hostPath: { type: "Directory", path: this.configPath },
                },
                {
                    name: "prom-data",
                    hostPath: { type: "Directory", path: this.dataPath },
                },
            ];
        });
    }
    generateVolumesMounts() {
        return [
            {
                name: "prom-cfg",
                mountPath: "/etc/prometheus",
                readOnly: false,
            },
            {
                name: "prom-data",
                mountPath: "/data",
                readOnly: false,
            },
        ];
    }
    generateContainersPorts() {
        return __awaiter(this, void 0, void 0, function* () {
            return [
                {
                    containerPort: 9090,
                    name: "prometheus_endpoint",
                    hostPort: yield (0, utils_1.getRandomPort)(),
                },
            ];
        });
    }
    generateContainers(volumeMounts, ports) {
        return [
            {
                image: "docker.io/prom/prometheus",
                name: "prometheus",
                imagePullPolicy: "Always",
                ports,
                volumeMounts,
            },
        ];
    }
    generatePodSpec(containers, volumes) {
        return {
            apiVersion: "v1",
            kind: "Pod",
            metadata: {
                name: "prometheus",
                namespace: this.namespace,
                labels: {
                    "zombie-role": "prometheus",
                    app: "zombienet",
                    "zombie-ns": this.namespace,
                },
            },
            spec: {
                hostname: "prometheus",
                restartPolicy: "OnFailure",
                volumes,
                containers,
            },
        };
    }
}
exports.PrometheusResource = PrometheusResource;
