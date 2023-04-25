import { getChainSpecRaw, setupChainSpec } from "./chainSpec";
import { genBootnodeDef, genNodeDef, replaceNetworkRef } from "./dynResourceDefinition";
import { KubeClient, initClient } from "./kubeClient";
export declare const provider: {
    KubeClient: typeof KubeClient;
    genBootnodeDef: typeof genBootnodeDef;
    genNodeDef: typeof genNodeDef;
    initClient: typeof initClient;
    setupChainSpec: typeof setupChainSpec;
    getChainSpecRaw: typeof getChainSpecRaw;
    replaceNetworkRef: typeof replaceNetworkRef;
};
