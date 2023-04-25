"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.provider = void 0;
const chainSpec_1 = require("./chainSpec");
const dynResourceDefinition_1 = require("./dynResourceDefinition");
const podmanClient_1 = require("./podmanClient");
exports.provider = {
    PodmanClient: podmanClient_1.PodmanClient,
    genBootnodeDef: dynResourceDefinition_1.genBootnodeDef,
    genNodeDef: dynResourceDefinition_1.genNodeDef,
    initClient: podmanClient_1.initClient,
    setupChainSpec: chainSpec_1.setupChainSpec,
    getChainSpecRaw: chainSpec_1.getChainSpecRaw,
    replaceNetworkRef: dynResourceDefinition_1.replaceNetworkRef,
};
