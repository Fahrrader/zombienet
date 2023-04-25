"use strict";
// CONSTANTS
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZOMBIE_WRAPPER = exports.TRACING_COLLATOR_PORT = exports.TRACING_COLLATOR_PODNAME = exports.TRACING_COLLATOR_NAMESPACE = exports.TRACING_COLLATOR_SERVICE = exports.TRACING_COLLATOR_NAME = exports.INTROSPECTOR_POD_NAME = exports.INTROSPECTOR_PORT = exports.BAKCCHANNEL_POD_NAME = exports.BAKCCHANNEL_PORT = exports.BAKCCHANNEL_URI_PATTERN = exports.LOCALHOST = exports.METRICS_URI_PATTERN = exports.WS_URI_PATTERN = exports.ZOMBIE_BUCKET = exports.TRANSFER_CONTAINER_NAME = exports.WAIT_UNTIL_SCRIPT_SUFIX = exports.NODE_CONTAINER_WAIT_LOG = exports.TRANSFER_CONTAINER_WAIT_LOG = exports.TMP_DONE = exports.PLAIN_CHAIN_SPEC_IN_CMD_PATTERN = exports.RAW_CHAIN_SPEC_IN_CMD_PATTERN = exports.GENESIS_WASM_FILENAME = exports.GENESIS_STATE_FILENAME = exports.FINISH_MAGIC_FILE = exports.DEFAULT_MAX_NOMINATIONS = exports.DEFAULT_COLLATOR_IMAGE = exports.DEFAULT_CUMULUS_COLLATOR_BIN = exports.DEFAULT_ADDER_COLLATOR_BIN = exports.DEFAULT_WASM_GENERATE_SUBCOMMAND = exports.DEFAULT_GENESIS_GENERATE_SUBCOMMAND = exports.DEFAULT_CHAIN_SPEC_COMMAND = exports.DEFAULT_CHAIN_SPEC_RAW = exports.DEFAULT_CHAIN_SPEC = exports.DEFAULT_DATA_DIR = exports.DEFAULT_REMOTE_DIR = exports.DEFAULT_BOOTNODE_DOMAIN = exports.DEFAULT_BOOTNODE_PEER_ID = exports.DEFAULT_CHAIN = exports.DEFAULT_ARGS = exports.DEFAULT_IMAGE = exports.DEFAULT_COMMAND = exports.DEFAULT_INDIVIDUAL_TEST_TIMEOUT = exports.DEFAULT_GLOBAL_TIMEOUT = exports.DEFAULT_PORTS = exports.P2P_PORT = exports.RPC_HTTP_PORT = exports.RPC_WS_PORT = exports.PROMETHEUS_PORT = exports.REGULAR_BIN_PATH = void 0;
exports.K8S_WAIT_UNTIL_SCRIPT_SUFIX = exports.UNDYING_COLLATOR_BIN = exports.ARGS_TO_REMOVE = exports.DEFAULT_BALANCE = exports.DEV_ACCOUNTS = exports.DEFAULT_PROVIDER = void 0;
// Substrate binary
const REGULAR_BIN_PATH = "substrate";
exports.REGULAR_BIN_PATH = REGULAR_BIN_PATH;
// The remote port prometheus can be accessed with
const PROMETHEUS_PORT = 9615;
exports.PROMETHEUS_PORT = PROMETHEUS_PORT;
// The remote port websocket to access the RPC
const RPC_WS_PORT = 9944;
exports.RPC_WS_PORT = RPC_WS_PORT;
// The remote port http to access the RPC
const RPC_HTTP_PORT = 9933;
exports.RPC_HTTP_PORT = RPC_HTTP_PORT;
// The port substrate listens for p2p connections on
const P2P_PORT = 30333;
exports.P2P_PORT = P2P_PORT;
const DEFAULT_PORTS = {
    p2pPort: P2P_PORT,
    wsPort: RPC_WS_PORT,
    rpcPort: RPC_HTTP_PORT,
    prometheusPort: PROMETHEUS_PORT,
};
exports.DEFAULT_PORTS = DEFAULT_PORTS;
const DEFAULT_GLOBAL_TIMEOUT = 1200; // 20 mins
exports.DEFAULT_GLOBAL_TIMEOUT = DEFAULT_GLOBAL_TIMEOUT;
const DEFAULT_INDIVIDUAL_TEST_TIMEOUT = 10; // seconds
exports.DEFAULT_INDIVIDUAL_TEST_TIMEOUT = DEFAULT_INDIVIDUAL_TEST_TIMEOUT;
const DEFAULT_COMMAND = "polkadot";
exports.DEFAULT_COMMAND = DEFAULT_COMMAND;
const DEFAULT_IMAGE = "parity/polkadot:latest";
exports.DEFAULT_IMAGE = DEFAULT_IMAGE;
const DEFAULT_ARGS = [];
exports.DEFAULT_ARGS = DEFAULT_ARGS;
const DEFAULT_CHAIN = "rococo-local";
exports.DEFAULT_CHAIN = DEFAULT_CHAIN;
const DEFAULT_BOOTNODE_PEER_ID = "12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp";
exports.DEFAULT_BOOTNODE_PEER_ID = DEFAULT_BOOTNODE_PEER_ID;
const DEFAULT_BOOTNODE_DOMAIN = "bootnode";
exports.DEFAULT_BOOTNODE_DOMAIN = DEFAULT_BOOTNODE_DOMAIN;
const DEFAULT_REMOTE_DIR = "/cfg";
exports.DEFAULT_REMOTE_DIR = DEFAULT_REMOTE_DIR;
const DEFAULT_DATA_DIR = "/data";
exports.DEFAULT_DATA_DIR = DEFAULT_DATA_DIR;
const DEFAULT_CHAIN_SPEC = "{{chainName}}-plain.json";
exports.DEFAULT_CHAIN_SPEC = DEFAULT_CHAIN_SPEC;
const DEFAULT_CHAIN_SPEC_RAW = "{{chainName}}-raw.json";
exports.DEFAULT_CHAIN_SPEC_RAW = DEFAULT_CHAIN_SPEC_RAW;
const DEFAULT_CHAIN_SPEC_COMMAND = "{{DEFAULT_COMMAND}} build-spec --chain {{chainName}} --disable-default-bootnode";
exports.DEFAULT_CHAIN_SPEC_COMMAND = DEFAULT_CHAIN_SPEC_COMMAND;
const DEFAULT_GENESIS_GENERATE_SUBCOMMAND = "export-genesis-state";
exports.DEFAULT_GENESIS_GENERATE_SUBCOMMAND = DEFAULT_GENESIS_GENERATE_SUBCOMMAND;
const DEFAULT_WASM_GENERATE_SUBCOMMAND = "export-genesis-wasm";
exports.DEFAULT_WASM_GENERATE_SUBCOMMAND = DEFAULT_WASM_GENERATE_SUBCOMMAND;
const DEFAULT_ADDER_COLLATOR_BIN = "adder-collator";
exports.DEFAULT_ADDER_COLLATOR_BIN = DEFAULT_ADDER_COLLATOR_BIN;
const UNDYING_COLLATOR_BIN = "undying-collator";
exports.UNDYING_COLLATOR_BIN = UNDYING_COLLATOR_BIN;
const DEFAULT_CUMULUS_COLLATOR_BIN = "polkadot-parachain";
exports.DEFAULT_CUMULUS_COLLATOR_BIN = DEFAULT_CUMULUS_COLLATOR_BIN;
const DEFAULT_COLLATOR_IMAGE = "parity/polkadot-parachain:latest";
exports.DEFAULT_COLLATOR_IMAGE = DEFAULT_COLLATOR_IMAGE;
const DEFAULT_MAX_NOMINATIONS = 24; // kusama value is 24
exports.DEFAULT_MAX_NOMINATIONS = DEFAULT_MAX_NOMINATIONS;
const FINISH_MAGIC_FILE = "/tmp/finished.txt";
exports.FINISH_MAGIC_FILE = FINISH_MAGIC_FILE;
const GENESIS_STATE_FILENAME = "genesis-state";
exports.GENESIS_STATE_FILENAME = GENESIS_STATE_FILENAME;
const GENESIS_WASM_FILENAME = "genesis-wasm";
exports.GENESIS_WASM_FILENAME = GENESIS_WASM_FILENAME;
const RAW_CHAIN_SPEC_IN_CMD_PATTERN = new RegExp(/{{CHAIN_SPEC:RAW}}/gi);
exports.RAW_CHAIN_SPEC_IN_CMD_PATTERN = RAW_CHAIN_SPEC_IN_CMD_PATTERN;
const PLAIN_CHAIN_SPEC_IN_CMD_PATTERN = new RegExp(/{{CHAIN_SPEC:PLAIN}}/gi);
exports.PLAIN_CHAIN_SPEC_IN_CMD_PATTERN = PLAIN_CHAIN_SPEC_IN_CMD_PATTERN;
const TMP_DONE = "echo done > /tmp/zombie-tmp-done";
exports.TMP_DONE = TMP_DONE;
const TRANSFER_CONTAINER_WAIT_LOG = "waiting for tar to finish";
exports.TRANSFER_CONTAINER_WAIT_LOG = TRANSFER_CONTAINER_WAIT_LOG;
const NODE_CONTAINER_WAIT_LOG = "waiting for copy files to finish";
exports.NODE_CONTAINER_WAIT_LOG = NODE_CONTAINER_WAIT_LOG;
const WAIT_UNTIL_SCRIPT_SUFIX = `until [ -f ${FINISH_MAGIC_FILE} ]; do echo ${NODE_CONTAINER_WAIT_LOG}; sleep 1; done; echo copy files has finished`;
exports.WAIT_UNTIL_SCRIPT_SUFIX = WAIT_UNTIL_SCRIPT_SUFIX;
const K8S_WAIT_UNTIL_SCRIPT_SUFIX = `until [ -f ${FINISH_MAGIC_FILE} ]; do /cfg/coreutils echo "${NODE_CONTAINER_WAIT_LOG}"; /cfg/coreutils sleep 1; done; /cfg/coreutils echo "copy files has finished"`;
exports.K8S_WAIT_UNTIL_SCRIPT_SUFIX = K8S_WAIT_UNTIL_SCRIPT_SUFIX;
const TRANSFER_CONTAINER_NAME = "transfer-files-container";
exports.TRANSFER_CONTAINER_NAME = TRANSFER_CONTAINER_NAME;
const ZOMBIE_BUCKET = "zombienet-logs";
exports.ZOMBIE_BUCKET = ZOMBIE_BUCKET;
const WS_URI_PATTERN = "ws://{{IP}}:{{PORT}}";
exports.WS_URI_PATTERN = WS_URI_PATTERN;
const METRICS_URI_PATTERN = "http://{{IP}}:{{PORT}}/metrics";
exports.METRICS_URI_PATTERN = METRICS_URI_PATTERN;
const LOCALHOST = "127.0.0.1";
exports.LOCALHOST = LOCALHOST;
const BAKCCHANNEL_URI_PATTERN = "http://127.0.0.1:{{PORT}}";
exports.BAKCCHANNEL_URI_PATTERN = BAKCCHANNEL_URI_PATTERN;
const BAKCCHANNEL_PORT = 3000;
exports.BAKCCHANNEL_PORT = BAKCCHANNEL_PORT;
const BAKCCHANNEL_POD_NAME = "backchannel";
exports.BAKCCHANNEL_POD_NAME = BAKCCHANNEL_POD_NAME;
const INTROSPECTOR_PORT = 65432;
exports.INTROSPECTOR_PORT = INTROSPECTOR_PORT;
const INTROSPECTOR_POD_NAME = "introspector";
exports.INTROSPECTOR_POD_NAME = INTROSPECTOR_POD_NAME;
// Spans collator config
const TRACING_COLLATOR_NAME = "tracing_collator";
exports.TRACING_COLLATOR_NAME = TRACING_COLLATOR_NAME;
const TRACING_COLLATOR_SERVICE = "tempo-tempo-distributed-query-frontend"; // tempo installation in k8s
exports.TRACING_COLLATOR_SERVICE = TRACING_COLLATOR_SERVICE;
const TRACING_COLLATOR_NAMESPACE = "tempo"; // tempo installation in k8s
exports.TRACING_COLLATOR_NAMESPACE = TRACING_COLLATOR_NAMESPACE;
const TRACING_COLLATOR_PODNAME = "tempo"; // tempo installation in podman
exports.TRACING_COLLATOR_PODNAME = TRACING_COLLATOR_PODNAME;
const TRACING_COLLATOR_PORT = 3100;
exports.TRACING_COLLATOR_PORT = TRACING_COLLATOR_PORT;
const ZOMBIE_WRAPPER = "zombie-wrapper.sh";
exports.ZOMBIE_WRAPPER = ZOMBIE_WRAPPER;
const DEFAULT_PROVIDER = "kubernetes";
exports.DEFAULT_PROVIDER = DEFAULT_PROVIDER;
const DEV_ACCOUNTS = [
    "alice",
    "bob",
    "charlie",
    "dave",
    "eve",
    "ferdie",
    "one",
    "two",
];
exports.DEV_ACCOUNTS = DEV_ACCOUNTS;
// TODO: make this default less 0s if possible
const DEFAULT_BALANCE = 2000000000000;
exports.DEFAULT_BALANCE = DEFAULT_BALANCE;
const ARGS_TO_REMOVE = {
    alice: 1,
    bob: 1,
    charlie: 1,
    dave: 1,
    eve: 1,
    ferdie: 1,
    one: 1,
    two: 1,
    port: 2,
    "prometheus-external": 1,
    "ws-port": 2,
    "rpc-port": 2,
    "prometheus-port": 2,
    "node-key": 2,
    d: 2,
    "base-path": 2,
};
exports.ARGS_TO_REMOVE = ARGS_TO_REMOVE;
