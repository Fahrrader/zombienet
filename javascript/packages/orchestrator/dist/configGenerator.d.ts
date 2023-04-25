import { ComputedNetwork, LaunchConfig, Node, ParachainConfig } from "./types";
export declare const zombieWrapperPath: string;
export declare function generateNetworkSpec(config: LaunchConfig): Promise<ComputedNetwork>;
export declare function generateBootnodeSpec(config: ComputedNetwork): Promise<Node>;
export declare function getUniqueName(name: string): string;
export declare function getFirstCollatorCommand(parachain: ParachainConfig): string;
