import { getChainSpecRaw, setupChainSpec } from "./chainSpec";
import { genBootnodeDef, genNodeDef, replaceNetworkRef } from "./dynResourceDefinition";
import { NativeClient, initClient } from "./nativeClient";
export declare const provider: {
    NativeClient: typeof NativeClient;
    genBootnodeDef: typeof genBootnodeDef;
    genNodeDef: typeof genNodeDef;
    initClient: typeof initClient;
    setupChainSpec: typeof setupChainSpec;
    getChainSpecRaw: typeof getChainSpecRaw;
    replaceNetworkRef: typeof replaceNetworkRef;
};
