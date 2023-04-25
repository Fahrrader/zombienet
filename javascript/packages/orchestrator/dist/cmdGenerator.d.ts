import { Node } from "./types";
export declare function genCumulusCollatorCmd(nodeSetup: Node, cfgPath?: string, dataPath?: string, relayDataPath?: string, useWrapper?: boolean): Promise<string[]>;
export declare function genCmd(nodeSetup: Node, cfgPath?: string, dataPath?: string, useWrapper?: boolean): Promise<string[]>;
