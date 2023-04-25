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
exports.spawnNode = void 0;
const utils_1 = require("@zombienet/utils");
const path_1 = __importDefault(require("path"));
const bootnode_1 = require("./bootnode");
const chainSpec_1 = require("./chainSpec");
const constants_1 = require("./constants");
const keys_1 = require("./keys");
const network_1 = require("./network");
const networkNode_1 = require("./networkNode");
const providers_1 = require("./providers");
const types_1 = require("./types");
const debug = require("debug")("zombie::spawner");
const spawnNode = (client, node, network, bootnodes, filesToCopy, opts, parachain) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const namespace = client.namespace;
    const { genBootnodeDef, genNodeDef, replaceNetworkRef } = (0, providers_1.getProvider)(client.providerName);
    let parachainSpecId;
    // for relay chain we can have more than one bootnode.
    if ([types_1.ZombieRole.Node, types_1.ZombieRole.Collator].includes(node.zombieRole))
        node.bootnodes = node.bootnodes.concat(bootnodes);
    if (opts.jaegerUrl)
        node.jaegerUrl = opts.jaegerUrl;
    debug(`creating node: ${node.name}`);
    const podDef = yield (node.name === "bootnode"
        ? genBootnodeDef(namespace, node)
        : genNodeDef(namespace, node));
    const finalFilesToCopyToNode = [...filesToCopy];
    // add spec file if is provided
    if (parachain === null || parachain === void 0 ? void 0 : parachain.specPath) {
        finalFilesToCopyToNode.push({
            localFilePath: parachain.specPath,
            remoteFilePath: `${client.remoteDir}/${node.chain}-${parachain.id}.json`,
        });
        parachainSpecId = yield (0, chainSpec_1.getChainIdFromSpec)(parachain.specPath);
    }
    for (const override of node.overrides) {
        finalFilesToCopyToNode.push({
            localFilePath: override.local_path,
            remoteFilePath: `${client.remoteDir}/${override.remote_name}`,
        });
    }
    let keystoreLocalDir;
    if (node.accounts) {
        // check if the node directory exists if not create (e.g for k8s provider)
        let nodeFilesPath = client.tmpDir;
        if (parachain && parachain.name)
            nodeFilesPath += `/${parachain.name}`;
        nodeFilesPath += `/${node.name}`;
        yield (0, utils_1.makeDir)(nodeFilesPath, true);
        const isStatemint = parachain && ((_a = parachain.chain) === null || _a === void 0 ? void 0 : _a.includes("statemint"));
        const keystoreFiles = yield (0, keys_1.generateKeystoreFiles)(node, nodeFilesPath, isStatemint);
        keystoreLocalDir = path_1.default.dirname(keystoreFiles[0]);
    }
    // replace all network references in command
    replaceNetworkRef(podDef, network);
    yield client.spawnFromDef(podDef, finalFilesToCopyToNode, keystoreLocalDir, parachainSpecId || network.chainId, node.dbSnapshot);
    const [nodeIp, nodePort] = yield client.getNodeInfo(podDef.metadata.name);
    const nodeMultiAddress = yield (0, bootnode_1.generateNodeMultiAddress)(node.key, node.args, nodeIp, nodePort, true, node.p2pCertHash);
    let networkNode;
    const endpointPort = constants_1.RPC_WS_PORT;
    if (opts.inCI) {
        const nodeIp = yield client.getNodeIP(podDef.metadata.name);
        networkNode = new networkNode_1.NetworkNode(node.name, constants_1.WS_URI_PATTERN.replace("{{IP}}", nodeIp).replace("{{PORT}}", endpointPort.toString()), constants_1.METRICS_URI_PATTERN.replace("{{IP}}", nodeIp).replace("{{PORT}}", constants_1.PROMETHEUS_PORT.toString()), nodeMultiAddress, opts.userDefinedTypes);
    }
    else {
        const nodeIdentifier = `${podDef.kind}/${podDef.metadata.name}`;
        const fwdPort = yield client.startPortForwarding(endpointPort, nodeIdentifier);
        const nodePrometheusPort = yield client.startPortForwarding(constants_1.PROMETHEUS_PORT, nodeIdentifier);
        const listeningIp = opts.local_ip || constants_1.LOCALHOST;
        networkNode = new networkNode_1.NetworkNode(node.name, constants_1.WS_URI_PATTERN.replace("{{IP}}", listeningIp).replace("{{PORT}}", fwdPort.toString()), constants_1.METRICS_URI_PATTERN.replace("{{IP}}", listeningIp).replace("{{PORT}}", nodePrometheusPort.toString()), nodeMultiAddress, opts.userDefinedTypes);
    }
    networkNode.group = node.group;
    if (parachain) {
        const paraId = parachain.id;
        if (!network.paras[paraId])
            network.addPara(paraId, parachain.chainSpecPath, parachain.wasmPath, parachain.statePath);
        networkNode.parachainId = paraId;
        networkNode.para = parachain.para;
        network.addNode(networkNode, network_1.Scope.PARA);
    }
    else {
        network.addNode(networkNode, network_1.Scope.RELAY);
    }
    // Display info about the current node
    const logTable = new utils_1.CreateLogTable({
        colWidths: [20, 100],
        doubleBorder: true,
    });
    logTable.pushTo([
        ["Pod", utils_1.decorators.green(node.name)],
        ["Status", utils_1.decorators.green("Running")],
    ]);
    if (node.overrides && node.overrides.length > 0) {
        logTable.pushTo([
            [
                {
                    colSpan: 2,
                    content: `with ${utils_1.decorators.yellow("Overrides")}...`,
                },
            ],
        ]);
        for (const override of node.overrides) {
            logTable.pushTo([
                ["local_path", override.local_path],
                ["remote name", override.remote_name],
            ]);
        }
    }
    if (opts.monitorIsAvailable) {
        const loki_url = (0, utils_1.getLokiUrl)(namespace, podDef.metadata.name, network.networkStartTime);
        logTable.pushTo([
            [utils_1.decorators.green("Grafana logs url"), utils_1.decorators.magenta(loki_url)],
        ]);
    }
    else {
        logTable.pushTo([
            [
                {
                    colSpan: 2,
                    content: utils_1.decorators.magenta("You can follow the logs of the node by running this command: "),
                },
            ],
        ]);
        logTable.print();
        if (!opts.silent)
            console.log(client.getLogsCommand(podDef.metadata.name) + "\n\n");
    }
    return nodeMultiAddress;
});
exports.spawnNode = spawnNode;
