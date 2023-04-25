export declare namespace PolkadotLaunch {
    interface LaunchConfig {
        relaychain: RelayChainConfig;
        parachains: ParachainConfig[];
        simpleParachains: SimpleParachainConfig[];
        hrmpChannels: HrmpChannelsConfig[];
        types: any;
        finalization: boolean;
    }
    interface RelayChainConfig {
        bin: string;
        chain: string;
        nodes: {
            name: string;
            basePath?: string;
            wsPort: number;
            rpcPort?: number;
            nodeKey?: string;
            port: number;
            flags?: string[];
        }[];
        genesis?: JSON | ObjectJSON;
    }
    interface ParachainConfig {
        bin: string;
        id?: string;
        balance: string;
        chain?: string;
        nodes: ParachainNodeConfig[];
    }
    interface ParachainNodeConfig {
        rpcPort?: number;
        wsPort: number;
        port: number;
        basePath?: string;
        name?: string;
        flags: string[];
    }
    interface SimpleParachainConfig {
        bin: string;
        id: string;
        port: string;
        balance: string;
    }
    interface HrmpChannelsConfig {
        sender: number;
        recipient: number;
        maxCapacity: number;
        maxMessageSize: number;
    }
    interface CollatorOptions {
        name?: string;
        spec?: string;
        flags?: string[];
        basePath?: string;
        chain?: string;
        onlyOneParachainNode?: boolean;
    }
    interface ObjectJSON {
        [key: string]: ObjectJSON | number | string;
    }
}
