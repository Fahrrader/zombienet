"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BootNodeResource = void 0;
const types_1 = require("../../../types");
const nodeResource_1 = require("./nodeResource");
class BootNodeResource extends nodeResource_1.NodeResource {
    constructor(namespace, nodeSetupConfig) {
        super(namespace, nodeSetupConfig);
    }
    generatePodSpec(initContainers, containers, volumes) {
        return {
            apiVersion: "v1",
            kind: "Pod",
            metadata: {
                name: "bootnode",
                labels: {
                    "app.kubernetes.io/name": this.namespace,
                    "app.kubernetes.io/instance": "bootnode",
                    "zombie-role": types_1.ZombieRole.BootNode,
                    app: "zombienet",
                    "zombie-ns": this.namespace,
                },
            },
            spec: {
                hostname: "bootnode",
                containers,
                initContainers,
                restartPolicy: "Never",
                volumes,
                securityContext: {
                    fsGroup: 1000,
                    runAsUser: 1000,
                    runAsGroup: 1000,
                },
            },
        };
    }
}
exports.BootNodeResource = BootNodeResource;
