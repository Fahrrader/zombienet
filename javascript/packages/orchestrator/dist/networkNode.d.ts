import { ApiPromise } from "@polkadot/api";
import { BucketHash, Metrics } from "./metrics";
import { PARA } from "./paras-decorators";
export interface NetworkNodeInterface {
    name: string;
    wsUri?: string;
    prometheusUri?: string;
    apiInstance?: ApiPromise;
}
export declare class NetworkNode implements NetworkNodeInterface {
    name: string;
    wsUri: string;
    prometheusUri: string;
    multiAddress: string;
    apiInstance?: ApiPromise;
    spec?: object | undefined;
    cachedMetrics?: Metrics;
    userDefinedTypes: any;
    para?: PARA;
    parachainId?: number;
    lastLogLineCheckedTimestamp?: string;
    lastLogLineCheckedIndex?: number;
    group?: string;
    constructor(name: string, wsUri: string, prometheusUri: string, multiAddress: string, userDefinedTypes?: any);
    connectApi(): Promise<void>;
    restart(timeout?: number | null): Promise<boolean>;
    pause(): Promise<boolean>;
    resume(): Promise<boolean>;
    isUp(timeout?: number): Promise<boolean>;
    parachainIsRegistered(parachainId: number, timeout?: number): Promise<boolean>;
    parachainBlockHeight(parachainId: number, desiredValue: number, timeout?: number): Promise<number>;
    getMetric(rawMetricName: string, comparator: string, desiredMetricValue?: number | null, timeout?: number): Promise<number | undefined>;
    getHistogramSamplesInBuckets(rawmetricName: string, buckets: string[], // empty string means all.
    desiredMetricValue?: number | null, timeout?: number): Promise<number>;
    countPatternLines(pattern: string, isGlob: boolean, timeout?: number): Promise<number>;
    findPattern(pattern: string, isGlob: boolean, timeout?: number): Promise<boolean>;
    run(scriptPath: string, args: string[], timeout?: number): Promise<void>;
    getSpansByTraceId(traceId: string, collatorUrl: string): Promise<string[]>;
    _dedupLogs(logs: string[], useIndex?: boolean): string[];
    _getMetric(metricName: string, metricShouldExists?: boolean): number | undefined;
    _getSamplesCount(buckets: BucketHash, bucketKeys: string[]): number;
}
