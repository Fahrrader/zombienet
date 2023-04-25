import { Node } from "../types";
export type GenesisNodeKey = [string, string, {
    [key: string]: string;
}];
export declare function getNodeKey(node: Node, useStash?: boolean): GenesisNodeKey;
declare const _default: {
    getNodeKey: typeof getNodeKey;
};
export default _default;
