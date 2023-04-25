import { LaunchConfig } from "./types";
export interface LocalJsonFileContentIF {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
    };
}
export declare function writeLocalJsonFile(path: string, fileName: string, content: LocalJsonFileContentIF): void;
/**
 * askQuestion: ask for user's Input
 * @param query : The string of the "question"
 * @returns
 */
export declare const askQuestion: (query: string) => Promise<string>;
export declare function loadTypeDef(types: string | object): object;
export declare function makeDir(dir: string, recursive?: boolean): Promise<void>;
export declare function getCredsFilePath(credsFile: string): string | undefined;
export declare function readNetworkConfig(filepath: string): LaunchConfig;
export declare function readDataFile(filepath: string): string;
