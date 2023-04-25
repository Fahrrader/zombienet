import { Node } from "../../../types";
import { NodeResource } from "./nodeResource";
import { Container, PodSpec, Volume } from "./types";
export declare class BootNodeResource extends NodeResource {
    constructor(namespace: string, nodeSetupConfig: Node);
    protected generatePodSpec(initContainers: Container[], containers: Container[], volumes: Volume[]): PodSpec;
}
