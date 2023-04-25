import { Node } from "./types";
export declare function generateKeyFromSeed(seed: string): Promise<any>;
export declare function generateKeyForNode(nodeName?: string): Promise<any>;
export declare function generateKeystoreFiles(node: Node, path: string, isStatemint?: boolean): Promise<string[]>;
