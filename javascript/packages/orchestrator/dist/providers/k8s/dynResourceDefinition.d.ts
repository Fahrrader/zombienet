import { Network } from "../../network";
import { Node } from "../../types";
import { PodSpec, ServiceSpec } from "./resources/types";
export declare function genBootnodeDef(namespace: string, nodeSetup: Node): Promise<any>;
export declare function genNodeDef(namespace: string, nodeSetup: Node): Promise<any>;
export declare function genServiceDef(podSpec: PodSpec): ServiceSpec;
export declare function replaceNetworkRef(podDef: any, network: Network): void;
export declare function createTempNodeDef(name: string, image: string, chain: string, fullCommand: string, useCommandSuffix?: boolean): Promise<Node>;
