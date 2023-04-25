/**
 * Test - performs test/assertions agins the spawned network, using a set of natural
 * language expressions that allow to make assertions based on metrics, logs and some
 * built-in function that query the network using polkadot.js
 * Read more here: https://paritytech.github.io/zombienet/cli/testing.html
 * @param testFile
 * @param runningNetworkSpec
 * @param opts (commander)
 * @param program (commander)
 */
export declare function test(testFile: string, runningNetworkSpec: string | undefined, cmdOpts: any, program: any): Promise<void>;
