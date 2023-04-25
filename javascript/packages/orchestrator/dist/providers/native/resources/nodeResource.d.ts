import { Node, ZombieRoleLabel } from "../../../types";
import { Client } from "../../client";
import { NodeSpec, Port, ProcessEnvironment } from "./types";
export declare class NodeResource {
    protected readonly namespace: string;
    protected readonly nodeSetupConfig: Node;
    protected readonly configPath: string;
    protected readonly dataPath: string;
    private readonly relayDataPath;
    constructor(client: Client, namespace: string, nodeSetupConfig: Node);
    generateSpec(): Promise<NodeSpec>;
    protected createDirectories(): Promise<void>;
    private portFromNodeSetupConfigOrDefault;
    private generatePorts;
    protected generateCommand(): Promise<string[]>;
    protected getZombieRoleLabel(): ZombieRoleLabel;
    protected getEnv(): ProcessEnvironment;
    protected generateNodeSpec(ports: Port[], command: string[], zombieRole: ZombieRoleLabel, env: ProcessEnvironment): NodeSpec;
}
