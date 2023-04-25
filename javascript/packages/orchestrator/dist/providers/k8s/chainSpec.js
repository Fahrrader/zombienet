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
exports.getChainSpecRaw = exports.setupChainSpec = void 0;
const fs_1 = require("fs");
const constants_1 = require("../../constants");
const client_1 = require("../client");
const dynResourceDefinition_1 = require("./dynResourceDefinition");
const debug = require("debug")("zombie::kube::chain-spec");
function setupChainSpec(namespace, chainConfig, chainName, chainFullPath) {
    return __awaiter(this, void 0, void 0, function* () {
        // We have two options to get the chain-spec file, neither should use the `raw` file/argument
        // 1: User provide the file (we DON'T expect the raw file)
        // 2: User provide the chainSpecCommand (without the --raw option)
        const client = (0, client_1.getClient)();
        if (chainConfig.chainSpecPath) {
            yield fs_1.promises.copyFile(chainConfig.chainSpecPath, chainFullPath);
        }
        else {
            if (chainConfig.chainSpecCommand) {
                const { defaultImage, chainSpecCommand } = chainConfig;
                const plainChainSpecOutputFilePath = client.remoteDir +
                    "/" +
                    constants_1.DEFAULT_CHAIN_SPEC.replace(/{{chainName}}/gi, chainName);
                const fullCommand = `${chainSpecCommand} > ${plainChainSpecOutputFilePath}`;
                const node = yield (0, dynResourceDefinition_1.createTempNodeDef)("temp", defaultImage, chainName, fullCommand);
                const podDef = yield (0, dynResourceDefinition_1.genNodeDef)(namespace, node);
                const podName = podDef.metadata.name;
                yield client.spawnFromDef(podDef);
                debug("waiting for chain-spec");
                yield client.waitLog(podName, podName, constants_1.NODE_CONTAINER_WAIT_LOG);
                debug("Getting the chain spec file from pod to the local environment.");
                yield client.copyFileFromPod(podName, plainChainSpecOutputFilePath, chainFullPath, podName);
                yield client.putLocalMagicFile(podName, podName);
            }
        }
    });
}
exports.setupChainSpec = setupChainSpec;
function getChainSpecRaw(namespace, image, chainName, chainCommand, chainFullPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = (0, client_1.getClient)();
        const plainPath = chainFullPath.replace(".json", "-plain.json");
        const remoteChainSpecFullPath = client.remoteDir +
            "/" +
            constants_1.DEFAULT_CHAIN_SPEC.replace(/{{chainName}}/, chainName);
        const remoteChainSpecRawFullPath = client.remoteDir +
            "/" +
            constants_1.DEFAULT_CHAIN_SPEC_RAW.replace(/{{chainName}}/, chainName);
        const chainSpecCommandRaw = constants_1.DEFAULT_CHAIN_SPEC_COMMAND.replace(/{{chainName}}/gi, remoteChainSpecFullPath).replace("{{DEFAULT_COMMAND}}", chainCommand);
        const fullCommand = `${chainSpecCommandRaw}  --raw > ${remoteChainSpecRawFullPath}`;
        const node = yield (0, dynResourceDefinition_1.createTempNodeDef)("temp", image, chainName, fullCommand);
        const podDef = yield (0, dynResourceDefinition_1.genNodeDef)(namespace, node);
        const podName = podDef.metadata.name;
        yield client.spawnFromDef(podDef, [
            {
                localFilePath: plainPath,
                remoteFilePath: remoteChainSpecFullPath,
            },
        ]);
        debug("waiting for raw chainSpec");
        yield client.waitLog(podName, podName, constants_1.NODE_CONTAINER_WAIT_LOG);
        debug("Getting the raw chain spec file from pod to the local environment.");
        yield client.copyFileFromPod(podName, remoteChainSpecRawFullPath, chainFullPath, podName);
        // We had some issues where the `raw` file is empty
        // let's add some extra checks here to ensure we are ok.
        let isValid = false;
        if (!isValid) {
            try {
                const result = yield client.runCommand([
                    "exec",
                    podName,
                    "--",
                    "/cfg/coreutils",
                    "cat",
                    remoteChainSpecRawFullPath,
                ]);
                if (result.exitCode === 0 && result.stdout.length > 0) {
                    // TODO: remove this debug when we get this fixed.
                    debug(result.stdout);
                    (0, fs_1.writeFileSync)(chainFullPath, result.stdout);
                    isValid = true;
                }
            }
            catch (e) {
                debug(e);
            }
        }
        if (!isValid)
            throw new Error(`Invalid chain spec raw file generated.`);
        yield client.putLocalMagicFile(podName, podName);
    });
}
exports.getChainSpecRaw = getChainSpecRaw;
