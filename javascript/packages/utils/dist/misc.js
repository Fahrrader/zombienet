"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateImageUrl = exports.getFilePathNameExt = exports.getRandom = exports.getLokiUrl = exports.convertExponentials = exports.filterConsole = exports.isValidHttpUrl = exports.convertBytes = exports.addMinutes = exports.getSha256 = exports.generateNamespace = exports.retry = exports.sleep = void 0;
const crypto_1 = require("crypto");
const util_1 = require("util");
const constants_1 = require("./constants");
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => setTimeout(resolve, ms));
    });
}
exports.sleep = sleep;
function retry(delayMs, timeoutMs, fn, errMsg) {
    return __awaiter(this, void 0, void 0, function* () {
        do {
            if (yield fn()) {
                return;
            }
            yield sleep(delayMs);
            timeoutMs -= delayMs;
        } while (timeoutMs > 0);
        throw new Error(`Timeout(${timeoutMs}) for: ${errMsg}`);
    });
}
exports.retry = retry;
function generateNamespace(n = 16) {
    const buf = (0, crypto_1.randomBytes)(n);
    return buf.toString("hex");
}
exports.generateNamespace = generateNamespace;
function getSha256(input) {
    return (0, crypto_1.createHash)("sha256").update(input).digest("hex");
}
exports.getSha256 = getSha256;
function addMinutes(howMany, baseDate) {
    const baseTs = baseDate ? baseDate.getTime() : new Date().getTime();
    const targetTs = baseTs + howMany * 60 * 1000;
    const targetDate = new Date(targetTs);
    return [targetDate.getUTCHours(), targetDate.getUTCMinutes()];
}
exports.addMinutes = addMinutes;
// Helper function to convert bytes to MB
const convertBytes = (bytes) => (bytes / Math.pow(1024, Math.floor(Math.log(bytes) / Math.log(1024)))).toFixed(0);
exports.convertBytes = convertBytes;
function isValidHttpUrl(input) {
    let url;
    try {
        url = new URL(input);
    }
    catch (_) {
        return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
}
exports.isValidHttpUrl = isValidHttpUrl;
function filterConsole(excludePatterns, options) {
    options = Object.assign({ console, methods: ["log", "debug", "info", "warn", "error"] }, options);
    const { console: consoleObject, methods } = options;
    const originalMethods = methods.map((method) => consoleObject[method]);
    const check = (output) => {
        for (const pattern of excludePatterns) {
            if (output.includes(pattern))
                return true;
        }
        return false;
    };
    for (const method of methods) {
        const originalMethod = consoleObject[method];
        consoleObject[method] = (...args) => {
            if (check((0, util_1.format)(...args))) {
                return;
            }
            originalMethod(...args);
        };
    }
    return () => {
        for (const [index, method] of methods.entries()) {
            consoleObject[method] = originalMethods[index];
        }
    };
}
exports.filterConsole = filterConsole;
// convert 1e+X (e.g 1e+21) to literal
function convertExponentials(data) {
    const converted = data.replace(/e\+[0-9]+/gi, function (exp) {
        const e = parseInt(exp.split("+")[1], 10);
        return "0".repeat(e);
    });
    return converted;
}
exports.convertExponentials = convertExponentials;
function getLokiUrl(namespace, podName, from, to) {
    const loki_url = constants_1.LOKI_URL_FOR_NODE.replace(/{{namespace}}/, namespace)
        .replace(/{{podName}}/, podName)
        .replace(/{{from}}/, from.toString())
        .replace(/{{to}}/, (to === null || to === void 0 ? void 0 : to.toString()) || "now");
    return loki_url;
}
exports.getLokiUrl = getLokiUrl;
function getRandom(arr, n) {
    let len = arr.length;
    const result = new Array(n), taken = new Array(len);
    while (n--) {
        const x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}
exports.getRandom = getRandom;
function getFilePathNameExt(filePath) {
    // Get path, fileName and extension
    const index = filePath.lastIndexOf("/");
    const fullPath = index < 0 ? "." : filePath.slice(0, index);
    const fileNameWithExt = index < 0 ? filePath : filePath.slice(index + 1);
    const extension = fileNameWithExt.split(".").pop() || "";
    const [fileName] = fileNameWithExt.split(".");
    return { fullPath, fileName, extension };
}
exports.getFilePathNameExt = getFilePathNameExt;
function validateImageUrl(image) {
    const ipRegexStr = "((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))";
    const hostnameRegexStr = "((([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]).)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9]))";
    const tagNameRegexStr = "([a-z0-9](-*[a-z0-9])*)";
    const tagVersionRegexStr = "([a-z0-9_]([-._a-z0-9])*)";
    const RepoTagRegexStr = `^(${ipRegexStr}|${hostnameRegexStr}/)?${tagNameRegexStr}(:${tagVersionRegexStr})?$`;
    const regex = new RegExp(RepoTagRegexStr);
    if (!image.match(regex)) {
        throw new Error("Image's URL is invalid: `" + image + "`");
    }
    return image;
}
exports.validateImageUrl = validateImageUrl;
