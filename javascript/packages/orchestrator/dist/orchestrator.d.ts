import { Network } from "./network";
import { LaunchConfig } from "./types";
export interface OrcOptionsInterface {
    monitor?: boolean;
    spawnConcurrency?: number;
    inCI?: boolean;
    dir?: string;
    force?: boolean;
    silent?: boolean;
    setGlobalNetwork?: (network: Network) => void;
}
export declare function start(credentials: string, launchConfig: LaunchConfig, options?: OrcOptionsInterface): Promise<Network>;
export declare function test(credentials: string, networkConfig: LaunchConfig, cb: (network: Network) => void): Promise<void>;
