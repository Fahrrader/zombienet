/// <reference types="node" />
import { fileMap } from "../../types";
import { Client, RunCommandOptions, RunCommandResponse } from "../client";
export interface ReplaceMapping {
    [propertyName: string]: string;
}
export declare function initClient(configPath: string, namespace: string, tmpDir: string): KubeClient;
export declare class KubeClient extends Client {
    namespace: string;
    chainId?: string;
    configPath: string;
    debug: boolean;
    timeout: number;
    command: string;
    tmpDir: string;
    podMonitorAvailable: boolean;
    localMagicFilepath: string;
    remoteDir: string;
    dataDir: string;
    constructor(configPath: string, namespace: string, tmpDir: string);
    validateAccess(): Promise<boolean>;
    createNamespace(): Promise<void>;
    spawnFromDef(podDef: any, filesToCopy?: fileMap[], keystore?: string, chainSpecId?: string, dbSnapshot?: string): Promise<void>;
    putLocalMagicFile(name: string, container?: string): Promise<void>;
    createResource(resourseDef: any, scoped?: boolean): Promise<void>;
    waitPodReady(pod: string): Promise<void>;
    waitContainerInState(pod: string, container: string, state: string): Promise<void>;
    waitLog(pod: string, container: string, log: string): Promise<void>;
    waitTransferContainerReady(pod: string): Promise<void>;
    createStaticResource(filename: string, scopeNamespace?: string, replacements?: {
        [properyName: string]: string;
    }): Promise<void>;
    createPodMonitor(filename: string, chain: string): Promise<void>;
    updateResource(filename: string, scopeNamespace?: string, replacements?: ReplaceMapping): Promise<void>;
    copyFileToPod(identifier: string, localFilePath: string, podFilePath: string, container?: string | undefined, unique?: boolean): Promise<void>;
    copyFileFromPod(identifier: string, podFilePath: string, localFilePath: string, container?: string | undefined): Promise<void>;
    runningOnMinikube(): Promise<boolean>;
    destroyNamespace(): Promise<void>;
    getNodeIP(identifier: string): Promise<string>;
    getNodeInfo(identifier: string, port?: number): Promise<[string, number]>;
    staticSetup(settings: any): Promise<void>;
    checkFileServer(): Promise<boolean>;
    spawnBackchannel(): Promise<void>;
    setupCleaner(): Promise<NodeJS.Timer>;
    cronJobCleanerSetup(): Promise<void>;
    upsertCronJob(minutes?: number): Promise<void>;
    isNamespaceActive(): Promise<boolean>;
    startPortForwarding(port: number, identifier: string, namespace?: string): Promise<number>;
    getNodeLogs(podName: string, since?: number | undefined, withTimestamp?: boolean): Promise<string>;
    dumpLogs(path: string, podName: string): Promise<void>;
    runCommand(args: string[], opts?: RunCommandOptions): Promise<RunCommandResponse>;
    runScript(identifier: string, scriptPath: string, args?: string[]): Promise<RunCommandResponse>;
    isPodMonitorAvailable(): Promise<boolean>;
    getPauseArgs(name: string): string[];
    getResumeArgs(name: string): string[];
    restartNode(name: string, timeout: number | null): Promise<boolean>;
    spawnIntrospector(wsUri: string): Promise<void>;
    uploadToFileserver(localFilePath: string, fileName: string, fileHash: string): Promise<void>;
    getLogsCommand(name: string): string;
}
