import { Node } from "../types";
export type GenesisNodeKey = [string, string, {
    [key: string]: string;
}];
export declare function getNodeKey(node: Node): GenesisNodeKey;
declare function clearAuthorities(specPath: string): Promise<void>;
declare function addParaCustom(specPath: string, node: Node): Promise<void>;
declare const _default: {
    getNodeKey: typeof getNodeKey;
    clearAuthorities: typeof clearAuthorities;
    addParaCustom: typeof addParaCustom;
};
export default _default;
