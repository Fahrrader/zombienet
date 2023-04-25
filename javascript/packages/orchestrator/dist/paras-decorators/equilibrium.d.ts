import { Node } from "../types";
export type GenesisNodeKey = [string, string, {
    [key: string]: string;
}];
export declare function addAuthority(specPath: string, node: Node, key: GenesisNodeKey): Promise<void>;
export declare function getNodeKey(node: Node, useStash?: boolean): GenesisNodeKey;
export declare function clearAuthorities(specPath: string): void;
declare const _default: {
    getNodeKey: typeof getNodeKey;
    addAuthority: typeof addAuthority;
    clearAuthorities: typeof clearAuthorities;
};
export default _default;
