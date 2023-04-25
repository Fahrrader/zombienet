import { TestDefinition } from "../types";
export interface BackchannelMap {
    [propertyName: string]: any;
}
export declare function run(configBasePath: string, testName: string, testDef: TestDefinition, provider: string, inCI: boolean | undefined, concurrency: number | undefined, silent: boolean | undefined, runningNetworkSpecPath: string | undefined, dir: string | undefined): Promise<void>;
