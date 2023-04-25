import { Node } from "../../../types";
import { Client } from "../../client";
import { NodeResource } from "./nodeResource";
import { Container, PodSpec, Volume } from "./types";
export declare class BootNodeResource extends NodeResource {
    constructor(client: Client, namespace: string, nodeSetupConfig: Node);
    protected generatePodSpec(containers: Container[], volumes: Volume[]): PodSpec;
}
