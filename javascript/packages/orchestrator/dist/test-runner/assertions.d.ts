import { BackchannelMap } from ".";
import { Network } from "../network";
import { FnArgs } from "../types";
declare const _default: {
    IsUp: ({ node_name, timeout }: FnArgs) => (network: Network) => Promise<void>;
    Report: ({ node_name, metric_name, target_value, op, timeout, }: FnArgs) => (network: Network) => Promise<void>;
    Histogram: ({ node_name, metric_name, target_value, buckets, op, timeout, }: FnArgs) => (network: Network) => Promise<void>;
    Trace: ({ node_name, span_id, pattern }: FnArgs) => (network: Network) => Promise<void>;
    LogMatch: ({ node_name, pattern, match_type, timeout }: FnArgs) => (network: Network) => Promise<void>;
    CountLogMatch: ({ node_name, pattern, match_type, op, target_value, timeout, }: FnArgs) => (network: Network) => Promise<void>;
    SystemEvent: ({ node_name, pattern, match_type, timeout }: FnArgs) => (network: Network) => Promise<void>;
    CustomJs: ({ node_name, file_path, custom_args, op, target_value, timeout, }: FnArgs) => (network: Network, _backchannelMap: BackchannelMap, configBasePath: string) => Promise<void>;
    CustomSh: ({ node_name, file_path, custom_args, op, target_value, timeout, }: FnArgs) => (network: Network, _backchannelMap: BackchannelMap, configBasePath: string) => Promise<void>;
    ParaBlockHeight: ({ node_name, para_id, target_value, op, timeout, }: FnArgs) => (network: Network) => Promise<void>;
    ParaIsRegistered: ({ node_name, para_id, timeout }: FnArgs) => (network: Network) => Promise<void>;
    ParaRuntimeUpgrade: ({ node_name, para_id, file_or_uri, timeout, }: FnArgs) => (network: Network, _backchannelMap: BackchannelMap, configBasePath: string) => Promise<void>;
    ParaRuntimeDummyUpgrade: ({ node_name, para_id, timeout }: FnArgs) => (network: Network) => Promise<void>;
};
export default _default;
