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
exports.getCliArgsVersion = void 0;
const types_1 = require("../../types");
const client_1 = require("../client");
const getCliArgsVersion = (image, command) => __awaiter(void 0, void 0, void 0, function* () {
    const client = (0, client_1.getClient)();
    const fullCmd = `${command} --help | grep ws-port`;
    const logs = (yield client.runCommand(["-c", fullCmd], { allowFail: true }))
        .stdout;
    return logs.includes("--ws-port <PORT>")
        ? types_1.SubstrateCliArgsVersion.V0
        : types_1.SubstrateCliArgsVersion.V1;
});
exports.getCliArgsVersion = getCliArgsVersion;
