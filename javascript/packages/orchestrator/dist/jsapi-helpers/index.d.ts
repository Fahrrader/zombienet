import { ApiPromise } from "@polkadot/api";
import { RegisterParachainOptions } from "../types";
import { chainCustomSectionUpgrade, chainUpgradeFromLocalFile, chainUpgradeFromUrl, validateRuntimeCode } from "./chainUpgrade";
import { findPatternInSystemEventSubscription } from "./events";
import { paraGetBlockHeight, paraIsRegistered } from "./parachain";
declare function connect(apiUrl: string, types?: any): Promise<ApiPromise>;
declare function registerParachain({ id, wasmPath, statePath, apiUrl, onboardAsParachain, seed, finalization, }: RegisterParachainOptions): Promise<void>;
export { connect, registerParachain, chainUpgradeFromLocalFile, chainUpgradeFromUrl, chainCustomSectionUpgrade, validateRuntimeCode, paraGetBlockHeight, paraIsRegistered, findPatternInSystemEventSubscription, };
