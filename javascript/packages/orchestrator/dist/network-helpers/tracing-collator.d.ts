import { Network } from "../network";
import { Client } from "../providers/client";
import { ComputedNetwork } from "../types";
export declare function setTracingCollatorConfig(networkSpec: ComputedNetwork, network: Network, client: Client): Promise<void>;
