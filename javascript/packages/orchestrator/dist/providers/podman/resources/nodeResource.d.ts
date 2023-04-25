import { Node } from "../../../types";
import { Client } from "../../client";
import { Container, PodSpec, Volume } from "./types";
export declare class NodeResource {
    protected readonly namespace: string;
    protected readonly nodeSetupConfig: Node;
    private readonly configPath;
    private readonly dataPath;
    private readonly relayDataPath;
    constructor(client: Client, namespace: string, nodeSetupConfig: Node);
    generateSpec(): Promise<PodSpec>;
    private createVolumeDirectories;
    private generateVolumes;
    private generateVolumesMounts;
    private portFromNodeSetupConfigOrDefault;
    private generateContainersPorts;
    private generateContainerCommand;
    private generateContainers;
    protected generatePodSpec(containers: Container[], volumes: Volume[]): PodSpec;
}
