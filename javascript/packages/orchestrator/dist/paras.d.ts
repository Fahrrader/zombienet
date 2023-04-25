import { Parachain } from "./types";
export declare function generateParachainFiles(namespace: string, tmpDir: string, parachainFilesPath: string, configBasePath: string | URL, relayChainName: string, parachain: Parachain, relayChainSpecIsRaw: boolean): Promise<void>;
