"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BootNodeResource = void 0;
const types_1 = require("../../../types");
const nodeResource_1 = require("./nodeResource");
class BootNodeResource extends nodeResource_1.NodeResource {
    constructor(client, namespace, nodeSetupConfig) {
        super(client, namespace, nodeSetupConfig);
    }
    generatePodSpec(containers, volumes) {
        return {
            apiVersion: "v1",
            kind: "Pod",
            metadata: {
                name: "bootnode",
                namespace: this.namespace,
                labels: {
                    "zombie-role": types_1.ZombieRole.BootNode,
                    app: "zombienet",
                    "zombie-ns": this.namespace,
                },
            },
            spec: {
                hostname: "bootnode",
                initContainers: [],
                restartPolicy: "OnFailure",
                volumes,
                containers,
            },
        };
    }
}
exports.BootNodeResource = BootNodeResource;
