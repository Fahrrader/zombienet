declare const REGULAR_BIN_PATH = "substrate";
declare const PROMETHEUS_PORT = 9615;
declare const RPC_WS_PORT = 9944;
declare const RPC_HTTP_PORT = 9933;
declare const P2P_PORT = 30333;
declare const DEFAULT_PORTS: {
    p2pPort: number;
    wsPort: number;
    rpcPort: number;
    prometheusPort: number;
};
declare const DEFAULT_GLOBAL_TIMEOUT = 1200;
declare const DEFAULT_INDIVIDUAL_TEST_TIMEOUT = 10;
declare const DEFAULT_COMMAND = "polkadot";
declare const DEFAULT_IMAGE = "parity/polkadot:latest";
declare const DEFAULT_ARGS: string[];
declare const DEFAULT_CHAIN = "rococo-local";
declare const DEFAULT_BOOTNODE_PEER_ID = "12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp";
declare const DEFAULT_BOOTNODE_DOMAIN = "bootnode";
declare const DEFAULT_REMOTE_DIR = "/cfg";
declare const DEFAULT_DATA_DIR = "/data";
declare const DEFAULT_CHAIN_SPEC = "{{chainName}}-plain.json";
declare const DEFAULT_CHAIN_SPEC_RAW = "{{chainName}}-raw.json";
declare const DEFAULT_CHAIN_SPEC_COMMAND = "{{DEFAULT_COMMAND}} build-spec --chain {{chainName}} --disable-default-bootnode";
declare const DEFAULT_GENESIS_GENERATE_SUBCOMMAND = "export-genesis-state";
declare const DEFAULT_WASM_GENERATE_SUBCOMMAND = "export-genesis-wasm";
declare const DEFAULT_ADDER_COLLATOR_BIN = "adder-collator";
declare const UNDYING_COLLATOR_BIN = "undying-collator";
declare const DEFAULT_CUMULUS_COLLATOR_BIN = "polkadot-parachain";
declare const DEFAULT_COLLATOR_IMAGE = "parity/polkadot-parachain:latest";
declare const DEFAULT_MAX_NOMINATIONS = 24;
declare const FINISH_MAGIC_FILE = "/tmp/finished.txt";
declare const GENESIS_STATE_FILENAME = "genesis-state";
declare const GENESIS_WASM_FILENAME = "genesis-wasm";
declare const RAW_CHAIN_SPEC_IN_CMD_PATTERN: RegExp;
declare const PLAIN_CHAIN_SPEC_IN_CMD_PATTERN: RegExp;
declare const TMP_DONE = "echo done > /tmp/zombie-tmp-done";
declare const TRANSFER_CONTAINER_WAIT_LOG = "waiting for tar to finish";
declare const NODE_CONTAINER_WAIT_LOG = "waiting for copy files to finish";
declare const WAIT_UNTIL_SCRIPT_SUFIX: string;
declare const K8S_WAIT_UNTIL_SCRIPT_SUFIX: string;
declare const TRANSFER_CONTAINER_NAME = "transfer-files-container";
declare const ZOMBIE_BUCKET = "zombienet-logs";
declare const WS_URI_PATTERN = "ws://{{IP}}:{{PORT}}";
declare const METRICS_URI_PATTERN = "http://{{IP}}:{{PORT}}/metrics";
declare const LOCALHOST = "127.0.0.1";
declare const BAKCCHANNEL_URI_PATTERN = "http://127.0.0.1:{{PORT}}";
declare const BAKCCHANNEL_PORT = 3000;
declare const BAKCCHANNEL_POD_NAME = "backchannel";
declare const INTROSPECTOR_PORT = 65432;
declare const INTROSPECTOR_POD_NAME = "introspector";
declare const TRACING_COLLATOR_NAME = "tracing_collator";
declare const TRACING_COLLATOR_SERVICE = "tempo-tempo-distributed-query-frontend";
declare const TRACING_COLLATOR_NAMESPACE = "tempo";
declare const TRACING_COLLATOR_PODNAME = "tempo";
declare const TRACING_COLLATOR_PORT = 3100;
declare const ZOMBIE_WRAPPER = "zombie-wrapper.sh";
declare const DEFAULT_PROVIDER = "kubernetes";
declare const DEV_ACCOUNTS: string[];
declare const DEFAULT_BALANCE = 2000000000000;
declare const ARGS_TO_REMOVE: {
    [key: string]: number;
};
export { REGULAR_BIN_PATH, PROMETHEUS_PORT, RPC_WS_PORT, RPC_HTTP_PORT, P2P_PORT, DEFAULT_PORTS, DEFAULT_GLOBAL_TIMEOUT, DEFAULT_INDIVIDUAL_TEST_TIMEOUT, DEFAULT_COMMAND, DEFAULT_IMAGE, DEFAULT_ARGS, DEFAULT_CHAIN, DEFAULT_BOOTNODE_PEER_ID, DEFAULT_BOOTNODE_DOMAIN, DEFAULT_REMOTE_DIR, DEFAULT_DATA_DIR, DEFAULT_CHAIN_SPEC, DEFAULT_CHAIN_SPEC_RAW, DEFAULT_CHAIN_SPEC_COMMAND, DEFAULT_GENESIS_GENERATE_SUBCOMMAND, DEFAULT_WASM_GENERATE_SUBCOMMAND, DEFAULT_ADDER_COLLATOR_BIN, DEFAULT_CUMULUS_COLLATOR_BIN, DEFAULT_COLLATOR_IMAGE, DEFAULT_MAX_NOMINATIONS, FINISH_MAGIC_FILE, GENESIS_STATE_FILENAME, GENESIS_WASM_FILENAME, RAW_CHAIN_SPEC_IN_CMD_PATTERN, PLAIN_CHAIN_SPEC_IN_CMD_PATTERN, TMP_DONE, TRANSFER_CONTAINER_WAIT_LOG, NODE_CONTAINER_WAIT_LOG, WAIT_UNTIL_SCRIPT_SUFIX, TRANSFER_CONTAINER_NAME, ZOMBIE_BUCKET, WS_URI_PATTERN, METRICS_URI_PATTERN, LOCALHOST, BAKCCHANNEL_URI_PATTERN, BAKCCHANNEL_PORT, BAKCCHANNEL_POD_NAME, INTROSPECTOR_PORT, INTROSPECTOR_POD_NAME, TRACING_COLLATOR_NAME, TRACING_COLLATOR_SERVICE, TRACING_COLLATOR_NAMESPACE, TRACING_COLLATOR_PODNAME, TRACING_COLLATOR_PORT, ZOMBIE_WRAPPER, DEFAULT_PROVIDER, DEV_ACCOUNTS, DEFAULT_BALANCE, ARGS_TO_REMOVE, UNDYING_COLLATOR_BIN, K8S_WAIT_UNTIL_SCRIPT_SUFIX, };
