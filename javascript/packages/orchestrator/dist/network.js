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
exports.Network = exports.rebuildNetwork = exports.Scope = void 0;
const utils_1 = require("@zombienet/utils");
const fs_1 = __importDefault(require("fs"));
const chainSpec_1 = require("./chainSpec");
const constants_1 = require("./constants");
const networkNode_1 = require("./networkNode");
const debug = require("debug")("zombie::network");
var Scope;
(function (Scope) {
    Scope[Scope["RELAY"] = 0] = "RELAY";
    Scope[Scope["PARA"] = 1] = "PARA";
    Scope[Scope["COMPANION"] = 2] = "COMPANION";
})(Scope = exports.Scope || (exports.Scope = {}));
function rebuildNetwork(client, runningNetworkSpec) {
    const { namespace, tmpDir, companions, launched, backchannel, chainSpecFullPath, nodesByName, tracing_collator_url, } = runningNetworkSpec;
    const network = new Network(client, namespace, tmpDir);
    Object.assign(network, {
        companions,
        launched,
        backchannel,
        chainSpecFullPath,
        tracing_collator_url,
    });
    for (const nodeName of Object.keys(nodesByName)) {
        const node = nodesByName[nodeName];
        const networkNode = new networkNode_1.NetworkNode(node.name, node.wsUri, node.prometheusUri, node.userDefinedTypes);
        if (node.parachainId) {
            if (!network.paras[node.parachainId])
                network.addPara(node.parachainId, node.parachainSpecPath);
            networkNode.parachainId = node.parachainId;
        }
        networkNode.group = node.group;
        network.addNode(networkNode, node.parachainId ? Scope.PARA : Scope.RELAY);
    }
    // ensure keep running by mark that was already running
    network.wasRunning = true;
    return network;
}
exports.rebuildNetwork = rebuildNetwork;
class Network {
    constructor(client, namespace, tmpDir, startTime = new Date().getTime()) {
        this.relay = [];
        this.paras = {};
        this.groups = {};
        this.companions = [];
        this.nodesByName = {};
        this.launched = false;
        this.wasRunning = false;
        this.backchannelUri = "";
        this.client = client;
        this.namespace = namespace;
        this.tmpDir = tmpDir;
        this.networkStartTime = startTime;
    }
    addPara(parachainId, chainSpecPath, wasmPath, statePath) {
        if (!this.paras[parachainId]) {
            this.paras[parachainId] = {
                nodes: [],
                chainSpecPath,
                wasmPath,
                statePath,
            };
        }
    }
    addNode(node, scope) {
        if (scope === Scope.RELAY)
            this.relay.push(node);
        else if (scope == Scope.COMPANION)
            this.companions.push(node);
        else {
            if (!node.parachainId || !this.paras[node.parachainId])
                throw new Error("Invalid network node configuration, collator must set the parachainId");
            this.paras[node.parachainId].nodes.push(node);
        }
        this.nodesByName[node.name] = node;
        if (node.group) {
            if (!this.groups[node.group])
                this.groups[node.group] = [];
            this.groups[node.group].push(node);
        }
    }
    stop() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // Cleanup all api instances
            for (const node of Object.values(this.nodesByName)) {
                (_a = node.apiInstance) === null || _a === void 0 ? void 0 : _a.disconnect();
            }
            yield (0, chainSpec_1.destroyChainSpecProcesses)();
            yield this.client.destroyNamespace();
        });
    }
    dumpLogs(showLogPath = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const logsPath = this.tmpDir + "/logs";
            // create dump directory in local temp
            if (!fs_1.default.existsSync(logsPath))
                fs_1.default.mkdirSync(logsPath);
            const paraNodes = Object.values(this.paras).reduce((memo, value) => memo.concat(value.nodes), []);
            const dumpsPromises = this.relay.concat(paraNodes).map((node) => {
                this.client.dumpLogs(this.tmpDir, node.name);
            });
            yield Promise.all(dumpsPromises);
            if (showLogPath)
                new utils_1.CreateLogTable({ colWidths: [20, 100] }).pushToPrint([
                    [utils_1.decorators.green("Node's logs:"), utils_1.decorators.magenta(logsPath)],
                ]);
            return logsPath;
        });
    }
    upsertCronJob(minutes = 10) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.upsertCronJob(minutes);
        });
    }
    getBackchannelValue(key, timeout = constants_1.DEFAULT_INDIVIDUAL_TEST_TIMEOUT) {
        return __awaiter(this, void 0, void 0, function* () {
            let limitTimeout;
            let expired = false;
            let value;
            try {
                limitTimeout = setTimeout(() => {
                    expired = true;
                }, timeout * 1000);
                if (!this.backchannelUri) {
                    // create port-fw
                    const port = yield this.client.startPortForwarding(constants_1.BAKCCHANNEL_PORT, constants_1.BAKCCHANNEL_POD_NAME);
                    this.backchannelUri = constants_1.BAKCCHANNEL_URI_PATTERN.replace("{{PORT}}", port.toString());
                }
                let done = false;
                debug(`backchannel uri ${this.backchannelUri}`);
                while (!done) {
                    if (expired)
                        throw new Error(`Timeout(${timeout}s)`);
                    const fetchResult = yield fetch(`${this.backchannelUri}/${key}`, {
                        signal: (0, utils_1.TimeoutAbortController)(2).signal,
                    });
                    const response = yield fetchResult.json();
                    const { status } = response;
                    debug(`status: ${status}`);
                    if (status === 404 || (status >= 200 && status < 300)) {
                        return status === 404 || (status >= 200 && status < 300);
                    }
                    if (response.status === 200) {
                        done = true;
                        value = response.data;
                        continue;
                    }
                    // wait 2 secs between checks
                    yield new Promise((resolve) => setTimeout(resolve, 2000));
                }
                return value;
            }
            catch (err) {
                console.log(`\n ${utils_1.decorators.red("Error: ")} \t ${utils_1.decorators.bright(err)}\n`);
                if (limitTimeout)
                    clearTimeout(limitTimeout);
                throw err;
            }
        });
    }
    getNodeByName(nodeName) {
        const node = this.nodesByName[nodeName];
        if (!node)
            throw new Error(`NODE: ${nodeName} not present`);
        return node;
    }
    getNodes(nodeOrGroupName) {
        //check if is a node
        const node = this.nodesByName[nodeOrGroupName];
        if (node)
            return [node];
        //check if is a group
        const nodes = this.groups[nodeOrGroupName];
        if (!nodes)
            throw new Error(`Noode or Group: ${nodeOrGroupName} not present`);
        return nodes;
    }
    node(nodeName) {
        const node = this.nodesByName[nodeName];
        if (!node)
            throw new Error(`NODE: ${nodeName} not present`);
        return node;
    }
    // Testing abstraction
    nodeIsUp(nodeName) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const node = this.getNodeByName(nodeName);
                yield ((_a = node.apiInstance) === null || _a === void 0 ? void 0 : _a.rpc.system.name());
                return true;
            }
            catch (err) {
                console.log(`\n ${utils_1.decorators.red("Error: ")} \t ${utils_1.decorators.bright(err)}\n`);
                return false;
            }
        });
    }
    // show links for access and debug
    showNetworkInfo(provider) {
        const logTable = new utils_1.CreateLogTable({
            head: [
                {
                    colSpan: 2,
                    hAlign: "center",
                    content: utils_1.decorators.green("Network launched 🚀🚀"),
                },
            ],
            colWidths: [30, 100],
            wordWrap: true,
        });
        logTable.pushTo([
            ["Namespace", this.namespace],
            ["Provider", this.client.providerName],
        ]);
        for (const node of this.relay) {
            this.showNodeInfo(node, provider, logTable);
        }
        for (const [paraId, parachain] of Object.entries(this.paras)) {
            for (const node of parachain.nodes) {
                this.showNodeInfo(node, provider, logTable);
            }
            logTable.pushTo([[utils_1.decorators.cyan("Parachain ID"), paraId]]);
            if (parachain.chainSpecPath)
                logTable.pushTo([
                    [utils_1.decorators.cyan("ChainSpec Path"), parachain.chainSpecPath],
                ]);
        }
        if (this.companions.length) {
            logTable.pushTo([
                [
                    {
                        colSpan: 2,
                        content: "Companions",
                    },
                ],
            ]);
            for (const node of this.companions) {
                this.showNodeInfo(node, provider, logTable);
            }
        }
        logTable.print();
    }
    showNodeInfo(node, provider, logTable) {
        // Support native VSCode remote extension automatic port forwarding.
        // VSCode doesn't parse the encoded URI and we have no reason to encode
        // `localhost:port`.
        const wsUri = ["native", "podman"].includes(provider)
            ? node.wsUri
            : encodeURIComponent(node.wsUri);
        let logCommand = "";
        switch (this.client.providerName) {
            case "podman":
                logCommand = `podman logs -f ${node.name}_pod-${node.name}`;
                break;
            case "kubernetes":
                logCommand = `kubectl logs -f ${node.name} -c ${node.name} -n ${this.client.namespace}`;
                break;
            case "native":
                logCommand = `tail -f  ${this.client.tmpDir}/${node.name}.log`;
                break;
        }
        logTable.pushTo([
            [{ colSpan: 2, hAlign: "center", content: "Node Information" }],
            [utils_1.decorators.cyan("Name"), utils_1.decorators.green(node.name)],
            [
                utils_1.decorators.cyan("Direct Link"),
                `https://polkadot.js.org/apps/?rpc=${wsUri}#/explorer`,
            ],
            [utils_1.decorators.cyan("Prometheus Link"), node.prometheusUri],
            [utils_1.decorators.cyan("Log Cmd"), logCommand],
        ]);
    }
    replaceWithNetworInfo(placeholder) {
        return placeholder.replace(constants_1.TOKEN_PLACEHOLDER, (_substring, nodeName, key) => {
            const node = this.getNodeByName(nodeName);
            return node[key];
        });
    }
    cleanMetricsCache() {
        for (const node of Object.values(this.nodesByName)) {
            node.cleanMetricsCache();
        }
    }
}
exports.Network = Network;
