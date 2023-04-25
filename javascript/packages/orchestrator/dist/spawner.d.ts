import { Network } from "./network";
import { Client } from "./providers/client";
import { Node, NodeMultiAddress, Parachain, fileMap } from "./types";
export declare const spawnNode: (client: Client, node: Node, network: Network, bootnodes: string[], filesToCopy: fileMap[], opts: {
    silent: boolean;
    inCI: boolean;
    monitorIsAvailable: boolean;
    userDefinedTypes?: any;
    local_ip?: string;
    jaegerUrl?: string;
}, parachain?: Parachain) => Promise<NodeMultiAddress>;
