import { fileMap } from "../types";
export interface RunCommandResponse {
    exitCode: number;
    stdout: string;
    stderr?: string;
    errorMsg?: string;
}
export interface RunCommandOptions {
    resourceDef?: string;
    scoped?: boolean;
    allowFail?: boolean;
    mainCmd?: string;
}
export declare abstract class Client {
    namespace: string;
    configPath: string;
    debug: boolean;
    timeout: number;
    command: string;
    tmpDir: string;
    podMonitorAvailable: boolean;
    localMagicFilepath: string;
    providerName: string;
    remoteDir: string | undefined;
    constructor(configPath: string, namespace: string, tmpDir: string, command: string, providerName: string);
    abstract createNamespace(): Promise<void>;
    abstract staticSetup(settings: any): Promise<void>;
    abstract destroyNamespace(): Promise<void>;
    abstract getNodeLogs(podName: string, since?: number, withTimestamp?: boolean): Promise<string>;
    abstract dumpLogs(path: string, podName: string): Promise<void>;
    abstract upsertCronJob(minutes: number): Promise<void>;
    abstract startPortForwarding(port: number, identifier: string, namespace?: string): Promise<number>;
    abstract runCommand(args: string[], opts?: RunCommandOptions): Promise<RunCommandResponse>;
    abstract runScript(identifier: string, scriptPath: string, args: string[]): Promise<RunCommandResponse>;
    abstract spawnFromDef(podDef: any, filesToCopy?: fileMap[], keystore?: string, chainSpecId?: string, dbSnapshot?: string): Promise<void>;
    abstract copyFileFromPod(identifier: string, podFilePath: string, localFilePath: string, container?: string | undefined): Promise<void>;
    abstract putLocalMagicFile(name: string, container?: string): Promise<void>;
    abstract createResource(resourseDef: any, scoped: boolean, waitReady: boolean): Promise<void>;
    abstract createPodMonitor(filename: string, chain: string): Promise<void>;
    abstract setupCleaner(): Promise<any>;
    abstract isPodMonitorAvailable(): Promise<boolean>;
    abstract getPauseArgs(name: string): string[];
    abstract getResumeArgs(name: string): string[];
    abstract restartNode(name: string, timeout: number | null): Promise<boolean>;
    abstract getNodeInfo(identifier: string, port?: number): Promise<[string, number]>;
    abstract getNodeIP(identifier: string): Promise<string>;
    abstract spawnIntrospector(wsUri: string): Promise<void>;
    abstract validateAccess(): Promise<boolean>;
    abstract getLogsCommand(name: string): string;
}
export declare function getClient(): Client;
export declare function setClient(c: Client): void;
