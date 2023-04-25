"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.KubeClient = exports.initClient = void 0;
const utils_1 = require("@zombienet/utils");
const child_process_1 = require("child_process");
const execa_1 = __importDefault(require("execa"));
const path_1 = __importStar(require("path"));
const constants_1 = require("../../constants");
const client_1 = require("../client");
const fs = require("fs").promises;
const debug = require("debug")("zombie::kube::client");
function initClient(configPath, namespace, tmpDir) {
    const client = new KubeClient(configPath, namespace, tmpDir);
    (0, client_1.setClient)(client);
    return client;
}
exports.initClient = initClient;
// Here we cache each file we upload from local
// to just cp between pods and not upload again the same file.
const fileUploadCache = {};
class KubeClient extends client_1.Client {
    constructor(configPath, namespace, tmpDir) {
        super(configPath, namespace, tmpDir, "kubectl", "kubernetes");
        this.command = "kubectl";
        this.podMonitorAvailable = false;
        this.configPath = configPath;
        this.namespace = namespace;
        this.debug = true;
        this.timeout = 300; // secs
        this.tmpDir = tmpDir;
        this.localMagicFilepath = `${tmpDir}/finished.txt`;
        this.remoteDir = constants_1.DEFAULT_REMOTE_DIR;
        this.dataDir = constants_1.DEFAULT_DATA_DIR;
    }
    validateAccess() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.runCommand(["cluster-info"], { scoped: false });
                return result.exitCode === 0;
            }
            catch (e) {
                return false;
            }
        });
    }
    createNamespace() {
        return __awaiter(this, void 0, void 0, function* () {
            const namespaceDef = {
                apiVersion: "v1",
                kind: "Namespace",
                metadata: {
                    name: this.namespace,
                    labels: {
                        jobId: process.env.CI_JOB_ID || "",
                        projectName: process.env.CI_PROJECT_NAME || "",
                    },
                },
            };
            (0, utils_1.writeLocalJsonFile)(this.tmpDir, "namespace", namespaceDef);
            yield this.createResource(namespaceDef);
            // ensure namespace isolation IFF we are running in CI
            if (process.env.RUN_IN_CONTAINER === "1")
                yield this.createStaticResource("namespace-network-policy.yaml", this.namespace);
        });
    }
    spawnFromDef(podDef, filesToCopy = [], keystore, chainSpecId, dbSnapshot) {
        return __awaiter(this, void 0, void 0, function* () {
            const name = podDef.metadata.name;
            (0, utils_1.writeLocalJsonFile)(this.tmpDir, `${name}.json`, podDef);
            let logTable = new utils_1.CreateLogTable({
                colWidths: [20, 100],
            });
            logTable.pushTo([
                [utils_1.decorators.cyan("Pod"), utils_1.decorators.green(name)],
                [utils_1.decorators.cyan("Status"), utils_1.decorators.green("Launching")],
                [
                    utils_1.decorators.cyan("Image"),
                    utils_1.decorators.green(podDef.spec.containers[0].image),
                ],
                [
                    utils_1.decorators.cyan("Command"),
                    utils_1.decorators.white(podDef.spec.containers[0].command.join(" ")),
                ],
            ]);
            logTable.print();
            yield this.createResource(podDef, true);
            yield this.waitTransferContainerReady(name);
            if (dbSnapshot) {
                // we need to get the snapshot from a public access
                // and extract to /data
                yield this.runCommand([
                    "exec",
                    name,
                    "-c",
                    constants_1.TRANSFER_CONTAINER_NAME,
                    "--",
                    "ash",
                    "-c",
                    [
                        "mkdir",
                        "-p",
                        "/data/",
                        "&&",
                        "mkdir",
                        "-p",
                        "/relay-data/",
                        "&&",
                        "wget",
                        dbSnapshot,
                        "-O",
                        "/data/db.tgz",
                        "&&",
                        "cd",
                        "/",
                        "&&",
                        "tar",
                        "-xzvf",
                        "/data/db.tgz",
                    ].join(" "),
                ]);
            }
            if (keystore) {
                // initialize keystore
                yield this.runCommand([
                    "exec",
                    name,
                    "-c",
                    constants_1.TRANSFER_CONTAINER_NAME,
                    "--",
                    "mkdir",
                    "-p",
                    `/data/chains/${chainSpecId}/keystore`,
                ]);
                // inject keys
                yield this.copyFileToPod(name, keystore, `/data/chains/${chainSpecId}`, constants_1.TRANSFER_CONTAINER_NAME, true);
            }
            for (const fileMap of filesToCopy) {
                const { localFilePath, remoteFilePath, unique } = fileMap;
                yield this.copyFileToPod(name, localFilePath, remoteFilePath, constants_1.TRANSFER_CONTAINER_NAME, unique);
            }
            yield this.putLocalMagicFile(name);
            yield this.waitPodReady(name);
            logTable = new utils_1.CreateLogTable({
                colWidths: [20, 100],
            });
            logTable.pushToPrint([
                [utils_1.decorators.cyan("Pod"), utils_1.decorators.green(name)],
                [utils_1.decorators.cyan("Status"), utils_1.decorators.green("Ready")],
            ]);
        });
    }
    putLocalMagicFile(name, container) {
        return __awaiter(this, void 0, void 0, function* () {
            const target = container ? container : constants_1.TRANSFER_CONTAINER_NAME;
            const r = yield this.runCommand([
                "exec",
                name,
                "-c",
                target,
                "--",
                "sh",
                "-c",
                `/cfg/coreutils touch ${constants_1.FINISH_MAGIC_FILE}`,
            ]);
            debug(r);
        });
    }
    // accept a json def
    createResource(resourseDef, scoped = false) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.runCommand(["apply", "-f", "-"], {
                resourceDef: JSON.stringify(resourseDef),
                scoped,
            });
            debug(resourseDef);
        });
    }
    waitPodReady(pod) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = ["get", "pod", pod, "--no-headers"];
            yield (0, utils_1.retry)(3000, this.timeout * 1000, () => __awaiter(this, void 0, void 0, function* () {
                const result = yield this.runCommand(args);
                if (result.stdout.match(/Running|Completed/))
                    return true;
                if (result.stdout.match(/ErrImagePull|ImagePullBackOff/))
                    throw new Error(`Error pulling image for pod : ${pod}`);
            }), `waitPodReady(): pod: ${pod}`);
        });
    }
    waitContainerInState(pod, container, state) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = ["get", "pod", pod, "-o", "jsonpath={.status}"];
            yield (0, utils_1.retry)(3000, this.timeout * 1000, () => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const result = yield this.runCommand(args);
                const json = JSON.parse(result.stdout);
                const containerStatuses = (_a = json === null || json === void 0 ? void 0 : json.containerStatuses) !== null && _a !== void 0 ? _a : [];
                const initContainerStatuses = (_b = json === null || json === void 0 ? void 0 : json.initContainerStatuses) !== null && _b !== void 0 ? _b : [];
                for (const status of containerStatuses.concat(initContainerStatuses)) {
                    if (status.name === container && state in status.state)
                        return true;
                }
            }), `waitContainerInState(): pod: ${pod}, container: ${container}, state: ${state}`);
        });
    }
    waitLog(pod, container, log) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = ["logs", "--tail=1", pod, "-c", `${container}`];
            yield (0, utils_1.retry)(3000, this.timeout * 1000, () => __awaiter(this, void 0, void 0, function* () {
                const result = yield this.runCommand(args);
                if (result.stdout == log)
                    return true;
            }), `waitLog(): pod: ${pod}, container: ${container}, log: ${log}`);
        });
    }
    waitTransferContainerReady(pod) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.waitContainerInState(pod, constants_1.TRANSFER_CONTAINER_NAME, "running");
            yield this.waitLog(pod, constants_1.TRANSFER_CONTAINER_NAME, constants_1.TRANSFER_CONTAINER_WAIT_LOG);
        });
    }
    createStaticResource(filename, scopeNamespace, replacements) {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = (0, path_1.resolve)(__dirname, `../../../static-configs/${filename}`);
            const fileContent = yield fs.readFile(filePath);
            let resourceDef = fileContent
                .toString("utf-8")
                .replace(new RegExp("{{namespace}}", "g"), this.namespace);
            if (replacements) {
                for (const replacementKey of Object.keys(replacements)) {
                    resourceDef = resourceDef.replace(new RegExp(`{{${replacementKey}}}`, "g"), replacements[replacementKey]);
                }
            }
            if (scopeNamespace) {
                yield this.runCommand(["-n", scopeNamespace, "apply", "-f", "-"], {
                    resourceDef,
                });
            }
            else {
                yield this.runCommand(["apply", "-f", "-"], {
                    resourceDef,
                    scoped: false,
                });
            }
        });
    }
    createPodMonitor(filename, chain) {
        return __awaiter(this, void 0, void 0, function* () {
            this.podMonitorAvailable = yield this.isPodMonitorAvailable();
            if (!this.podMonitorAvailable) {
                debug("PodMonitor is NOT available in the cluster");
                return;
            }
            const filePath = (0, path_1.resolve)(__dirname, `../../../static-configs/${filename}`);
            const fileContent = yield fs.readFile(filePath);
            const resourceDef = fileContent
                .toString("utf-8")
                .replace(/{{namespace}}/gi, this.namespace)
                .replace(/{{chain}}/gi, chain);
            yield this.runCommand(["-n", "monitoring", "apply", "-f", "-"], {
                resourceDef,
                scoped: false,
            });
        });
    }
    updateResource(filename, scopeNamespace, replacements = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = (0, path_1.resolve)(__dirname, `../../../static-configs/${filename}`);
            const fileContent = yield fs.readFile(filePath);
            let resourceDef = fileContent
                .toString("utf-8")
                .replace(new RegExp("{{namespace}}", "g"), this.namespace);
            for (const replaceKey of Object.keys(replacements)) {
                resourceDef = resourceDef.replace(new RegExp(`{{${replaceKey}}}`, "g"), replacements[replaceKey]);
            }
            const cmd = scopeNamespace
                ? ["-n", scopeNamespace, "apply", "-f", "-"]
                : ["apply", "-f", "-"];
            yield this.runCommand(cmd, { resourceDef, scoped: false });
        });
    }
    copyFileToPod(identifier, localFilePath, podFilePath, container = undefined, unique = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (unique) {
                if (container === constants_1.TRANSFER_CONTAINER_NAME) {
                    const args = ["cp", localFilePath, `${identifier}:${podFilePath}`];
                    if (container)
                        args.push("-c", container);
                    yield this.runCommand(args);
                    debug("copyFileToPod", args);
                }
                else {
                    // we are copying to the main container and could be the case that tar
                    // isn't available
                    const args = [
                        "cat",
                        localFilePath,
                        "|",
                        this.command,
                        "exec",
                        "-n",
                        this.namespace,
                        identifier,
                    ];
                    if (container)
                        args.push("-c", container);
                    args.push("-i", "--", "/cfg/coreutils tee", podFilePath, ">", "/dev/null");
                    debug("copyFileToPod", args.join(" "));
                    // This require local cat binary
                    yield this.runCommand(["-c", args.join(" ")], { mainCmd: "bash" });
                }
            }
            else {
                const fileBuffer = yield fs.readFile(localFilePath);
                const fileHash = (0, utils_1.getSha256)(fileBuffer.toString());
                const parts = localFilePath.split("/");
                const fileName = parts[parts.length - 1];
                if (!fileUploadCache[fileHash]) {
                    yield this.uploadToFileserver(localFilePath, fileName, fileHash);
                }
                // download the file in the container
                const args = ["exec", identifier];
                if (container)
                    args.push("-c", container);
                let extraArgs = [
                    "--",
                    "/usr/bin/wget",
                    "-O",
                    podFilePath,
                    `http://fileserver/${fileHash}`,
                ];
                debug("copyFileToPodFromFileServer", [...args, ...extraArgs]);
                let result = yield this.runCommand([...args, ...extraArgs]);
                debug(result);
                if (container)
                    args.push("-c", container);
                extraArgs = ["--", "chmod", "+x", podFilePath];
                debug("copyFileToPodFromFileServer", [...args, ...extraArgs]);
                result = yield this.runCommand([...args, ...extraArgs]);
                debug(result);
            }
        });
    }
    copyFileFromPod(identifier, podFilePath, localFilePath, container = undefined) {
        return __awaiter(this, void 0, void 0, function* () {
            // /cat demo.txt | kubectl -n zombie-4bb2522de792f15656518846a908b8e7 exec  alice -- bash -c "/cfg/bat > /tmp/a.txt"
            // return ["exec", name, "--", "bash", "-c", "echo pause > /tmp/zombiepipe"];
            const args = ["exec", identifier];
            if (container)
                args.push("-c", container);
            args.push("--", "bash", "-c", `/cfg/coreutils cat ${podFilePath}`);
            // const args = ["exec", identifier, "--", "bash", "-c", `/cfg/bat ${podFilePath}` ]
            // const args = ["cp", `${identifier}:${podFilePath}`, localFilePath];
            debug("copyFileFromPod", args);
            const result = yield this.runCommand(args);
            debug(result.exitCode);
            yield fs.writeFile(localFilePath, result.stdout);
        });
    }
    runningOnMinikube() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.runCommand([
                "get",
                "sc",
                "-o",
                "go-template='{{range .items}}{{.provisioner}}{{\" \"}}{{end}}'",
            ]);
            return result.stdout.includes("k8s.io/minikube-hostpath");
        });
    }
    destroyNamespace() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.podMonitorAvailable) {
                yield this.runCommand(["delete", "podmonitor", this.namespace, "-n", "monitoring"], {
                    scoped: false,
                });
            }
            yield this.runCommand(["delete", "namespace", this.namespace], {
                scoped: false,
            });
        });
    }
    getNodeIP(identifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = ["get", "pod", identifier, "-o", "jsonpath={.status.podIP}"];
            const result = yield this.runCommand(args);
            return result.stdout;
        });
    }
    getNodeInfo(identifier, port) {
        return __awaiter(this, void 0, void 0, function* () {
            const ip = yield this.getNodeIP(identifier);
            return [ip, port ? port : constants_1.P2P_PORT];
        });
    }
    staticSetup(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            const storageFiles = (yield this.runningOnMinikube())
                ? [
                    "node-data-tmp-storage-class-minikube.yaml",
                    "node-data-persistent-storage-class-minikube.yaml",
                ]
                : [
                    "node-data-tmp-storage-class.yaml",
                    "node-data-persistent-storage-class.yaml",
                ];
            const resources = [
                { type: "data-storage-classes", files: storageFiles },
                {
                    type: "services",
                    files: [
                        "bootnode-service.yaml",
                        settings.backchannel ? "backchannel-service.yaml" : null,
                        "fileserver-service.yaml",
                    ],
                },
                {
                    type: "deployment",
                    files: [
                        settings.backchannel ? "backchannel-pod.yaml" : null,
                        "fileserver-pod.yaml",
                    ],
                },
            ];
            for (const resourceType of resources) {
                for (const file of resourceType.files) {
                    if (file)
                        yield this.createStaticResource(file, this.namespace);
                }
            }
            // wait until fileserver is ready, fix race condition #700.
            yield this.waitPodReady("fileserver");
            (0, utils_1.sleep)(3 * 1000);
            let fileServerOk = false;
            let attempts = 0;
            // try 5 times at most
            for (attempts; attempts < 5; attempts++) {
                if (yield this.checkFileServer())
                    fileServerOk = true;
                else
                    (0, utils_1.sleep)(1 * 1000);
            }
            if (!fileServerOk)
                throw new Error(`Can't connect to fileServer, after ${attempts} attempts`);
            // ensure baseline resources if we are running in CI
            if (process.env.RUN_IN_CONTAINER === "1")
                yield this.createStaticResource("baseline-resources.yaml", this.namespace);
        });
    }
    checkFileServer() {
        return __awaiter(this, void 0, void 0, function* () {
            const args = ["exec", "Pod/fileserver", "--", "curl", `http://localhost/`];
            debug("checking fileserver", args);
            const result = yield this.runCommand(args);
            debug("result", result);
            return result.stdout.includes("Welcome to nginx");
        });
    }
    spawnBackchannel() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Not implemented function");
        });
    }
    setupCleaner() {
        return __awaiter(this, void 0, void 0, function* () {
            this.podMonitorAvailable = yield this.isPodMonitorAvailable();
            // create CronJob cleanner for namespace
            yield this.cronJobCleanerSetup();
            yield this.upsertCronJob();
            const cronInterval = setInterval(() => __awaiter(this, void 0, void 0, function* () { return yield this.upsertCronJob(); }), 8 * 60 * 1000);
            return cronInterval;
        });
    }
    cronJobCleanerSetup() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.podMonitorAvailable)
                yield this.createStaticResource("job-delete-podmonitor-role.yaml", "monitoring");
            yield this.createStaticResource("job-svc-account.yaml");
        });
    }
    upsertCronJob(minutes = 10) {
        return __awaiter(this, void 0, void 0, function* () {
            const isActive = yield this.isNamespaceActive();
            if (isActive) {
                const now = new Date();
                if (this.podMonitorAvailable) {
                    const [hr, min] = (0, utils_1.addMinutes)(minutes, now);
                    const schedule = `${min} ${hr} * * *`;
                    yield this.updateResource("job-delete-podmonitor.yaml", this.namespace, { schedule });
                }
                minutes += 1;
                const [hr, min] = (0, utils_1.addMinutes)(minutes, now);
                const nsSchedule = `${min} ${hr} * * *`;
                yield this.updateResource("job-delete-namespace.yaml", this.namespace, {
                    schedule: nsSchedule,
                });
            }
        });
    }
    isNamespaceActive() {
        return __awaiter(this, void 0, void 0, function* () {
            const args = [
                "get",
                "namespace",
                this.namespace,
                "-o",
                "jsonpath={.status.phase}",
            ];
            const result = yield this.runCommand(args, { scoped: false });
            if (result.exitCode !== 0 || result.stdout !== "Active")
                return false;
            return true;
        });
    }
    startPortForwarding(port, identifier, namespace) {
        return __awaiter(this, void 0, void 0, function* () {
            let intents = 0;
            const createTunnel = (remotePort, identifier, namespace, localPort) => {
                const mapping = localPort ? `${localPort}:${port}` : `:${port}`;
                const args = [
                    "port-forward",
                    identifier,
                    mapping,
                    "--namespace",
                    namespace || this.namespace,
                    "--kubeconfig",
                    this.configPath,
                ];
                const subprocess = (0, child_process_1.spawn)("kubectl", args);
                return subprocess;
            };
            return new Promise((resolve) => {
                let subprocess = createTunnel(port, identifier, namespace);
                let resolved = false;
                let mappedPort;
                subprocess.stdout.on("data", function (data) {
                    if (resolved)
                        return;
                    const stdout = data.toString();
                    const m = /.\d{1,3}:(\d+)/.exec(stdout);
                    debug("stdout: " + stdout);
                    if (m && !resolved) {
                        resolved = true;
                        mappedPort = parseInt(m[1], 10);
                        return resolve(mappedPort);
                    }
                });
                subprocess.stderr.on("data", function (data) {
                    const s = data.toString();
                    if (resolved && s.includes("error")) {
                        debug("stderr: " + s);
                    }
                });
                subprocess.on("exit", function () {
                    console.log("child process exited");
                    if (resolved && intents < 5 && process.env.terminating !== "1") {
                        intents++;
                        subprocess = null;
                        console.log(`creating new port-fw for ${identifier}, with map ${mappedPort}:${port}`);
                        createTunnel(port, identifier, namespace, mappedPort);
                    }
                });
            });
        });
    }
    getNodeLogs(podName, since = undefined, withTimestamp = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = ["logs"];
            if (since && since > 0)
                args.push(`--since=${since}s`);
            if (withTimestamp)
                args.push("--timestamps=true");
            args.push(...[podName, "-c", podName, "--namespace", this.namespace]);
            const result = yield this.runCommand(args, { scoped: false });
            return result.stdout;
        });
    }
    dumpLogs(path, podName) {
        return __awaiter(this, void 0, void 0, function* () {
            const dstFileName = `${path}/logs/${podName}.log`;
            const logs = yield this.getNodeLogs(podName);
            yield fs.writeFile(dstFileName, logs);
        });
    }
    // run kubectl
    runCommand(args, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const augmentedCmd = ["--kubeconfig", this.configPath];
                if ((opts === null || opts === void 0 ? void 0 : opts.scoped) === undefined || (opts === null || opts === void 0 ? void 0 : opts.scoped))
                    augmentedCmd.push("--namespace", this.namespace);
                const cmd = (opts === null || opts === void 0 ? void 0 : opts.mainCmd) || this.command;
                // only apply augmented args when we are using the default cmd.
                const finalArgs = cmd !== this.command ? args : [...augmentedCmd, ...args];
                debug("finalArgs", finalArgs);
                const result = yield (0, execa_1.default)(cmd, finalArgs, {
                    input: opts === null || opts === void 0 ? void 0 : opts.resourceDef,
                });
                return {
                    exitCode: result.exitCode,
                    stdout: result.stdout,
                };
            }
            catch (error) {
                debug(error);
                throw error;
            }
        });
    }
    runScript(identifier, scriptPath, args = []) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const scriptFileName = path_1.default.basename(scriptPath);
                const scriptPathInPod = `/tmp/${scriptFileName}`;
                // upload the script
                yield this.copyFileToPod(identifier, scriptPath, scriptPathInPod, undefined, true);
                // set as executable
                const baseArgs = ["exec", `Pod/${identifier}`, "--"];
                yield this.runCommand([...baseArgs, "chmod", "+x", scriptPathInPod]);
                // exec
                const result = yield this.runCommand([
                    ...baseArgs,
                    "bash",
                    scriptPathInPod,
                    ...args,
                ]);
                return {
                    exitCode: result.exitCode,
                    stdout: result.stdout,
                };
            }
            catch (error) {
                debug(error);
                throw error;
            }
        });
    }
    isPodMonitorAvailable() {
        return __awaiter(this, void 0, void 0, function* () {
            let available = false;
            try {
                const result = yield execa_1.default.command("kubectl api-resources -o name");
                if (result.exitCode == 0) {
                    if (result.stdout.includes("podmonitor"))
                        available = true;
                }
            }
            catch (err) {
                console.log(`\n ${utils_1.decorators.red("Error: ")} \t ${utils_1.decorators.bright(err)}\n`);
            }
            return available;
        });
    }
    getPauseArgs(name) {
        return ["exec", name, "--", "bash", "-c", "echo pause > /tmp/zombiepipe"];
    }
    getResumeArgs(name) {
        return ["exec", name, "--", "bash", "-c", "echo resume > /tmp/zombiepipe"];
    }
    restartNode(name, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = ["exec", name, "--", "bash", "-c"];
            const cmd = timeout
                ? `echo restart ${timeout} > /tmp/zombiepipe`
                : `echo restart > /tmp/zombiepipe`;
            args.push(cmd);
            const result = yield this.runCommand(args, { scoped: true });
            return result.exitCode === 0;
        });
    }
    spawnIntrospector(wsUri) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.createStaticResource("introspector-pod.yaml", this.namespace, {
                WS_URI: wsUri,
            });
            yield this.createStaticResource("introspector-service.yaml", this.namespace);
            yield this.waitPodReady("introspector");
        });
    }
    uploadToFileserver(localFilePath, fileName, fileHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const logTable = new utils_1.CreateLogTable({
                colWidths: [20, 100],
            });
            logTable.pushTo([
                [utils_1.decorators.cyan("Uploading:"), utils_1.decorators.green(localFilePath)],
                [utils_1.decorators.cyan("as:"), utils_1.decorators.green(fileHash)],
            ]);
            logTable.print();
            const args = [
                "cp",
                localFilePath,
                `fileserver:/usr/share/nginx/html/${fileHash}`,
            ];
            debug("copyFileToPod", args);
            const result = yield this.runCommand(args);
            debug(result);
            fileUploadCache[fileHash] = fileName;
        });
    }
    getLogsCommand(name) {
        return `kubectl logs -f ${name} -c ${name} -n ${this.namespace}`;
    }
}
exports.KubeClient = KubeClient;
