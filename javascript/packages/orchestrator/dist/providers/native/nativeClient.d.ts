import { fileMap } from "../../types";
import { Client, RunCommandOptions, RunCommandResponse } from "../client";
export declare function initClient(configPath: string, namespace: string, tmpDir: string): NativeClient;
export declare class NativeClient extends Client {
    namespace: string;
    chainId?: string;
    configPath: string;
    debug: boolean;
    timeout: number;
    tmpDir: string;
    podMonitorAvailable: boolean;
    localMagicFilepath: string;
    remoteDir: string;
    dataDir: string;
    processMap: {
        [name: string]: {
            pid?: number;
            logs: string;
            portMapping: {
                [original: number]: number;
            };
            cmd?: string[];
        };
    };
    constructor(configPath: string, namespace: string, tmpDir: string);
    validateAccess(): Promise<boolean>;
    createNamespace(): Promise<void>;
    staticSetup(): Promise<void>;
    createStaticResource(): Promise<void>;
    createPodMonitor(): Promise<void>;
    setupCleaner(): Promise<void>;
    destroyNamespace(): Promise<void>;
    getNodeLogs(name: string): Promise<string>;
    dumpLogs(path: string, podName: string): Promise<void>;
    upsertCronJob(): Promise<void>;
    startPortForwarding(port: number, identifier: string): Promise<number>;
    getPortMapping(port: number, podName: string): Promise<number>;
    getNodeInfo(podName: string): Promise<[string, number]>;
    getNodeIP(): Promise<string>;
    runCommand(args: string[], opts?: RunCommandOptions): Promise<RunCommandResponse>;
    runScript(identifier: string, scriptPath: string, args?: string[]): Promise<RunCommandResponse>;
    spawnFromDef(podDef: any, filesToCopy: fileMap[] | undefined, keystore: string, chainSpecId: string, dbSnapshot?: string): Promise<void>;
    copyFileFromPod(identifier: string, podFilePath: string, localFilePath: string): Promise<void>;
    putLocalMagicFile(): Promise<void>;
    createResource(resourseDef: any): Promise<void>;
    wait_node_ready(nodeName: string): Promise<void>;
    isPodMonitorAvailable(): Promise<boolean>;
    spawnIntrospector(): Promise<void>;
    getPauseArgs(name: string): string[];
    getResumeArgs(name: string): string[];
    restartNode(name: string, timeout: number | null): Promise<boolean>;
    getLogsCommand(name: string): string;
}
