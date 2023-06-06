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
exports.NetworkNode = void 0;
const api_1 = require("@polkadot/api");
const minimatch_1 = require("minimatch");
const constants_1 = require("./constants");
const metrics_1 = require("./metrics");
const client_1 = require("./providers/client");
const utils_1 = require("@zombienet/utils");
const jsapi_helpers_1 = require("./jsapi-helpers");
const debug = require("debug")("zombie::network-node");
class NetworkNode {
    constructor(name, wsUri, prometheusUri, multiAddress, userDefinedTypes = null, prometheusPrefix = "substrate") {
        this.name = name;
        this.wsUri = wsUri;
        this.prometheusUri = prometheusUri;
        this.multiAddress = multiAddress;
        this.prometheusPrefix = prometheusPrefix;
        if (userDefinedTypes)
            this.userDefinedTypes = userDefinedTypes;
    }
    connectApi() {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = new api_1.WsProvider(this.wsUri);
            debug(`Connecting api for ${this.name} at ${this.wsUri}...`);
            this.apiInstance = yield api_1.ApiPromise.create({
                provider,
                types: this.userDefinedTypes,
            });
            yield this.apiInstance.isReady;
            debug(`Connected to ${this.name}`);
        });
    }
    restart(timeout = null) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = (0, client_1.getClient)();
            yield client.restartNode(this.name, timeout);
            const url = new URL(this.wsUri);
            if (parseInt(url.port, 10) !== constants_1.RPC_WS_PORT &&
                client.providerName !== "native") {
                const fwdPort = yield client.startPortForwarding(constants_1.RPC_WS_PORT, this.name);
                this.wsUri = constants_1.WS_URI_PATTERN.replace("{{IP}}", constants_1.LOCALHOST).replace("{{PORT}}", fwdPort.toString());
                this.apiInstance = undefined;
            }
            return true;
        });
    }
    pause() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = (0, client_1.getClient)();
            const args = client.getPauseArgs(this.name);
            const scoped = client.providerName === "kubernetes";
            const result = yield client.runCommand(args, { scoped });
            return result.exitCode === 0;
        });
    }
    resume() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = (0, client_1.getClient)();
            const args = client.getResumeArgs(this.name);
            const scoped = client.providerName === "kubernetes";
            const result = yield client.runCommand(args, { scoped });
            return result.exitCode === 0;
        });
    }
    isUp(timeout = constants_1.DEFAULT_INDIVIDUAL_TEST_TIMEOUT) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let limitTimeout;
            try {
                limitTimeout = setTimeout(() => {
                    throw new Error(`Timeout(${timeout}s)`);
                }, timeout * 1000);
                yield ((_a = this.apiInstance) === null || _a === void 0 ? void 0 : _a.rpc.system.name());
                return true;
            }
            catch (err) {
                console.log(`\n ${utils_1.decorators.red("Error: ")} \t ${utils_1.decorators.bright(err)}\n`);
                return false;
            }
            finally {
                if (limitTimeout)
                    clearTimeout(limitTimeout);
            }
        });
    }
    parachainIsRegistered(parachainId, timeout = constants_1.DEFAULT_INDIVIDUAL_TEST_TIMEOUT) {
        return __awaiter(this, void 0, void 0, function* () {
            let expired = false;
            let limitTimeout;
            try {
                limitTimeout = setTimeout(() => {
                    expired = true;
                }, timeout * 1000);
                if (!this.apiInstance)
                    yield this.connectApi();
                let done = false;
                while (!done) {
                    if (expired)
                        throw new Error(`Timeout(${timeout}s)`);
                    // wait 2 secs between checks
                    yield new Promise((resolve) => setTimeout(resolve, 2000));
                    done = yield (0, jsapi_helpers_1.paraIsRegistered)(this.apiInstance, parachainId);
                }
                return true;
            }
            catch (err) {
                console.log(err);
                if (limitTimeout)
                    clearTimeout(limitTimeout);
                return false;
            }
        });
    }
    parachainBlockHeight(parachainId, desiredValue, timeout = constants_1.DEFAULT_INDIVIDUAL_TEST_TIMEOUT) {
        return __awaiter(this, void 0, void 0, function* () {
            let value = 0;
            try {
                const getValue = () => __awaiter(this, void 0, void 0, function* () {
                    while (desiredValue > value) {
                        // reconnect iff needed
                        if (!this.apiInstance)
                            yield this.connectApi();
                        yield new Promise((resolve) => setTimeout(resolve, 2000));
                        const blockNumber = yield (0, jsapi_helpers_1.paraGetBlockHeight)(this.apiInstance, parachainId);
                        value = blockNumber;
                    }
                    return;
                });
                const resp = yield Promise.race([
                    getValue(),
                    new Promise((resolve) => setTimeout(() => {
                        const err = new Error(`Timeout(${timeout}), "getting desired parachain block height ${desiredValue} within ${timeout} secs".`);
                        return resolve(err);
                    }, timeout * 1000)),
                ]);
                if (resp instanceof Error)
                    throw resp;
                return value;
            }
            catch (err) {
                console.log(`\n\t ${utils_1.decorators.red("Error: ")} \n\t\t ${utils_1.decorators.bright(err === null || err === void 0 ? void 0 : err.message)}\n`);
                return value || 0;
            }
        });
    }
    getMetric(rawMetricName, comparator, desiredMetricValue = null, timeout = constants_1.DEFAULT_INDIVIDUAL_TEST_TIMEOUT) {
        return __awaiter(this, void 0, void 0, function* () {
            let value;
            let timedout = false;
            try {
                // process_start_time_seconds metric is used by `is up`, and we don't want to use cached values.
                if (desiredMetricValue === null ||
                    !this.cachedMetrics ||
                    rawMetricName === "process_start_time_seconds") {
                    debug("reloading cache");
                    this.cachedMetrics = yield (0, metrics_1.fetchMetrics)(this.prometheusUri);
                }
                const metricName = (0, metrics_1.getMetricName)(rawMetricName);
                value = this._getMetric(metricName, desiredMetricValue === null);
                if (value !== undefined) {
                    if (desiredMetricValue === null ||
                        compare(comparator, value, desiredMetricValue)) {
                        debug(`value: ${value} ~ desiredMetricValue: ${desiredMetricValue}`);
                        return value;
                    }
                }
                const getValue = () => __awaiter(this, void 0, void 0, function* () {
                    let c = 0;
                    let done = false;
                    while (!done && !timedout) {
                        c++;
                        yield new Promise((resolve) => setTimeout(resolve, 1000));
                        debug(`fetching metrics - q: ${c}  time:  ${new Date()}`);
                        this.cachedMetrics = yield (0, metrics_1.fetchMetrics)(this.prometheusUri);
                        value = this._getMetric(metricName, desiredMetricValue === null);
                        if (value !== undefined &&
                            desiredMetricValue !== null &&
                            compare(comparator, value, desiredMetricValue)) {
                            done = true;
                        }
                        else {
                            debug(`current value: ${value} for metric ${rawMetricName}, keep trying...`);
                        }
                    }
                });
                const resp = yield Promise.race([
                    getValue(),
                    new Promise((resolve) => setTimeout(() => {
                        timedout = true;
                        const err = new Error(`Timeout(${timeout}), "getting desired metric value ${desiredMetricValue} within ${timeout} secs".`);
                        return resolve(err);
                    }, timeout * 1000)),
                ]);
                if (resp instanceof Error) {
                    // use `undefined` metrics values in `equal` comparations as `0`
                    if (timedout && comparator === "equal" && desiredMetricValue === 0)
                        value = 0;
                    else
                        throw resp;
                }
                return value || 0;
            }
            catch (err) {
                console.log(`\n\t ${utils_1.decorators.red("Error: ")} \n\t\t ${utils_1.decorators.bright(err === null || err === void 0 ? void 0 : err.message)}\n`);
                return value;
            }
        });
    }
    getCalcMetric(rawMetricNameA, rawMetricNameB, mathOp, comparator, desiredMetricValue, timeout = constants_1.DEFAULT_INDIVIDUAL_TEST_TIMEOUT) {
        return __awaiter(this, void 0, void 0, function* () {
            let value;
            let timedOut = false;
            try {
                const mathFn = (a, b) => {
                    return mathOp === "Minus" ? a - b : a + b;
                };
                const getValue = () => __awaiter(this, void 0, void 0, function* () {
                    while (!timedOut) {
                        const [valueA, valueB] = yield Promise.all([
                            this.getMetric(rawMetricNameA),
                            this.getMetric(rawMetricNameB),
                        ]);
                        value = mathFn(valueA, valueB);
                        if (value !== undefined &&
                            compare(comparator, value, desiredMetricValue)) {
                            break;
                        }
                        else {
                            debug(`current values for: [${rawMetricNameA}, ${rawMetricNameB}] are [${valueA}, ${valueB}], keep trying...`);
                            yield new Promise((resolve) => setTimeout(resolve, 1000));
                        }
                    }
                });
                const resp = yield Promise.race([
                    getValue(),
                    new Promise((resolve) => setTimeout(() => {
                        timedOut = true;
                        const err = new Error(`Timeout(${timeout}), "getting desired calc metric value ${desiredMetricValue} within ${timeout} secs".`);
                        return resolve(err);
                    }, timeout * 1000)),
                ]);
                if (resp instanceof Error) {
                    // use `undefined` metrics values in `equal` comparations as `0`
                    if (timedOut && comparator === "equal" && desiredMetricValue === 0)
                        value = 0;
                    else
                        throw resp;
                }
                return value;
            }
            catch (err) {
                console.log(`\n\t ${utils_1.decorators.red("Error: ")} \n\t\t ${utils_1.decorators.bright(err === null || err === void 0 ? void 0 : err.message)}\n`);
                return value;
            }
        });
    }
    getHistogramSamplesInBuckets(rawmetricName, buckets, // empty string means all.
    desiredMetricValue = null, timeout = constants_1.DEFAULT_INDIVIDUAL_TEST_TIMEOUT) {
        return __awaiter(this, void 0, void 0, function* () {
            let value;
            try {
                const metricName = (0, metrics_1.getMetricName)(rawmetricName);
                let histogramBuckets = yield (0, metrics_1.getHistogramBuckets)(this.prometheusUri, metricName);
                let value = this._getSamplesCount(histogramBuckets, buckets);
                if (desiredMetricValue === null || value >= desiredMetricValue) {
                    debug(`value: ${value} ~ desiredMetricValue: ${desiredMetricValue}`);
                    return value;
                }
                const getValue = () => __awaiter(this, void 0, void 0, function* () {
                    let done = false;
                    while (!done) {
                        yield new Promise((resolve) => setTimeout(resolve, 1000));
                        histogramBuckets = yield (0, metrics_1.getHistogramBuckets)(this.prometheusUri, metricName);
                        value = this._getSamplesCount(histogramBuckets, buckets);
                        if (value !== undefined &&
                            desiredMetricValue !== null &&
                            desiredMetricValue <= value) {
                            done = true;
                        }
                        else {
                            debug(`current value: ${value} for samples count of ${rawmetricName}, keep trying...`);
                        }
                    }
                });
                const resp = yield Promise.race([
                    getValue(),
                    new Promise((resolve) => setTimeout(() => {
                        const err = new Error(`Timeout(${timeout}), "getting samples count value ${desiredMetricValue} within ${timeout} secs".`);
                        return resolve(err);
                    }, timeout * 1000)),
                ]);
                if (resp instanceof Error)
                    throw resp;
                return value || 0;
            }
            catch (err) {
                console.log(`\n\t ${utils_1.decorators.red("Error: ")} \n\t\t ${utils_1.decorators.bright(err === null || err === void 0 ? void 0 : err.message)}\n`);
                return value || 0;
            }
        });
    }
    countPatternLines(pattern, isGlob, timeout = constants_1.DEFAULT_INDIVIDUAL_TEST_TIMEOUT) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let total_count = 0;
                const re = isGlob ? (0, minimatch_1.makeRe)(pattern) : new RegExp(pattern, "ig");
                if (!re)
                    throw new Error(`Invalid glob pattern: ${pattern} `);
                const client = (0, client_1.getClient)();
                const getValue = () => __awaiter(this, void 0, void 0, function* () {
                    yield new Promise((resolve) => setTimeout(resolve, timeout * 1000));
                    const logs = yield client.getNodeLogs(this.name, undefined, true);
                    for (let line of logs.split("\n")) {
                        if (client.providerName !== "native") {
                            // remove the extra timestamp
                            line = line.split(" ").slice(1).join(" ");
                        }
                        if (re.test(line)) {
                            total_count += 1;
                        }
                    }
                    return total_count;
                });
                const resp = yield Promise.race([
                    getValue(),
                    new Promise((resolve) => setTimeout(() => {
                        const err = new Error(`Timeout(${timeout}), "getting log pattern ${pattern} within ${timeout} secs".`);
                        return resolve(err);
                    }, (timeout + 2) * 1000)),
                ]);
                if (resp instanceof Error)
                    throw resp;
                return total_count;
            }
            catch (err) {
                console.log(`\n\t ${utils_1.decorators.red("Error: ")} \n\t\t ${utils_1.decorators.bright(err === null || err === void 0 ? void 0 : err.message)}\n`);
                return 0;
            }
        });
    }
    findPattern(pattern, isGlob, timeout = constants_1.DEFAULT_INDIVIDUAL_TEST_TIMEOUT) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let lastLogLineCheckedTimestamp;
                let lastLogLineCheckedIndex;
                const re = isGlob ? (0, minimatch_1.makeRe)(pattern) : new RegExp(pattern, "ig");
                if (!re)
                    throw new Error(`Invalid glob pattern: ${pattern} `);
                const client = (0, client_1.getClient)();
                let logs = yield client.getNodeLogs(this.name, undefined, true);
                const getValue = () => __awaiter(this, void 0, void 0, function* () {
                    let done = false;
                    while (!done) {
                        const dedupedLogs = this._dedupLogs(logs.split("\n"), client.providerName === "native", lastLogLineCheckedTimestamp, lastLogLineCheckedIndex);
                        const index = dedupedLogs.findIndex((line) => {
                            if (client.providerName !== "native") {
                                // remove the extra timestamp
                                line = line.split(" ").slice(1).join(" ");
                            }
                            return re.test(line);
                        });
                        if (index >= 0) {
                            done = true;
                            lastLogLineCheckedTimestamp = dedupedLogs[index];
                            lastLogLineCheckedIndex = index;
                            debug(lastLogLineCheckedTimestamp.split(" ").slice(1).join(" "));
                        }
                        else {
                            yield new Promise((resolve) => setTimeout(resolve, 1000));
                            logs = yield client.getNodeLogs(this.name, 2, true);
                        }
                    }
                });
                const resp = yield Promise.race([
                    getValue(),
                    new Promise((resolve) => setTimeout(() => {
                        const err = new Error(`Timeout(${timeout}), "getting log pattern ${pattern} within ${timeout} secs".`);
                        return resolve(err);
                    }, timeout * 1000)),
                ]);
                if (resp instanceof Error)
                    throw resp;
                return true;
            }
            catch (err) {
                console.log(`\n\t ${utils_1.decorators.red("Error: ")} \n\t\t ${utils_1.decorators.bright(err === null || err === void 0 ? void 0 : err.message)}\n`);
                return false;
            }
        });
    }
    run(scriptPath, args, timeout = constants_1.DEFAULT_INDIVIDUAL_TEST_TIMEOUT) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = (0, client_1.getClient)();
            const runScript = (scriptPath, args) => __awaiter(this, void 0, void 0, function* () {
                const r = yield client.runScript(this.name, scriptPath, args);
                if (r.exitCode !== 0)
                    throw new Error(`Error running cmd: ${scriptPath} with args ${args}`);
                debug(r.stdout);
                return r.stdout;
            });
            const resp = yield Promise.race([
                runScript(scriptPath, args),
                new Promise((resolve) => setTimeout(() => {
                    const err = new Error(`Timeout(${timeout}), "running cmd: ${scriptPath} with args ${args} within ${timeout} secs".`);
                    return resolve(err);
                }, timeout * 1000)),
            ]);
            if (resp instanceof Error)
                throw resp;
        });
    }
    getSpansByTraceId(traceId, collatorUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${collatorUrl}/api/traces/${traceId}`;
            const fetchResult = yield fetch(url, {
                signal: (0, utils_1.TimeoutAbortController)(2).signal,
            });
            const response = yield fetchResult.json();
            // filter batches
            const batches = response.data.batches.filter((batch) => {
                const serviceNameAttr = batch.resource.attributes.find((attr) => {
                    return attr.key === "service.name";
                });
                if (!serviceNameAttr)
                    return false;
                return (serviceNameAttr.value.stringValue.split("-").slice(1).join("-") ===
                    this.name);
            });
            // get the `names` of the spans
            const spanNames = [];
            for (const batch of batches) {
                for (const instrumentationSpan of batch.instrumentationLibrarySpans) {
                    for (const span of instrumentationSpan.spans) {
                        spanNames.push(span.name);
                    }
                }
            }
            return spanNames;
        });
    }
    cleanMetricsCache() {
        this.cachedMetrics = undefined;
    }
    // prevent to search in the same log line twice.
    _dedupLogs(logs, useIndex = false, lastLogLineCheckedTimestamp, lastLogLineCheckedIndex) {
        if (!lastLogLineCheckedTimestamp)
            return logs;
        if (useIndex)
            return logs.slice(lastLogLineCheckedIndex);
        const lastLineTs = lastLogLineCheckedTimestamp.split(" ")[0];
        const index = logs.findIndex((logLine) => {
            const thisLineTs = logLine.split(" ")[0];
            return thisLineTs > lastLineTs;
        });
        return logs.slice(index);
    }
    _getMetric(metricName, metricShouldExists = true) {
        if (!this.cachedMetrics)
            throw new Error("Metrics not availables");
        // loops over namespaces first
        for (const namespace of Object.keys(this.cachedMetrics)) {
            if (this.cachedMetrics[namespace] &&
                this.cachedMetrics[namespace][metricName] !== undefined) {
                debug("returning for: " + metricName + " from ns: " + namespace);
                debug("returning: " + this.cachedMetrics[namespace][metricName]);
                return this.cachedMetrics[namespace][metricName];
            }
        }
        if (metricShouldExists)
            throw new Error(`Metric: ${metricName} not found!`);
    }
    _getSamplesCount(buckets, bucketKeys) {
        debug("buckets samples count:");
        debug(buckets);
        debug(bucketKeys);
        let count = 0;
        for (const key of bucketKeys) {
            if (buckets[key] === undefined)
                throw new Error(`Bucket with le: ${key} is NOT present in metrics`);
            count += buckets[key];
        }
        return count;
    }
}
exports.NetworkNode = NetworkNode;
function compare(comparator, a, b) {
    debug(`using comparator ${comparator} for ${a}, ${b}`);
    switch (comparator.trim()) {
        case "equal":
            return a == b;
        case "isAbove":
            return a > b;
        case "isAtLeast":
            return a >= b;
        case "isBelow":
            return a < b;
        default:
            return a == b;
    }
}
