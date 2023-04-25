"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PROVIDER = exports.DEFAULT_GLOBAL_TIMEOUT = exports.DEFAULT_BALANCE = exports.AVAILABLE_PROVIDERS = void 0;
// CONSTANTS
const AVAILABLE_PROVIDERS = ["podman", "kubernetes", "native"];
exports.AVAILABLE_PROVIDERS = AVAILABLE_PROVIDERS;
const DEFAULT_BALANCE = 2000000000000;
exports.DEFAULT_BALANCE = DEFAULT_BALANCE;
const DEFAULT_GLOBAL_TIMEOUT = 1200; // 20 mins
exports.DEFAULT_GLOBAL_TIMEOUT = DEFAULT_GLOBAL_TIMEOUT;
const DEFAULT_PROVIDER = "kubernetes";
exports.DEFAULT_PROVIDER = DEFAULT_PROVIDER;
