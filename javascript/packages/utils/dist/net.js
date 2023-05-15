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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadFile = exports.getHostIp = exports.getRandomPort = void 0;
const dns_1 = __importDefault(require("dns"));
const fs_1 = __importDefault(require("fs"));
const net_1 = require("net");
const os_1 = __importDefault(require("os"));
const stream_1 = require("stream");
const promises_1 = require("stream/promises");
const colors_1 = require("./colors");
function getRandomPort() {
    return __awaiter(this, void 0, void 0, function* () {
        const inner = () => __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const server = (0, net_1.createServer)();
                server.unref();
                server.on("error", reject);
                server.listen(0, () => {
                    const { port } = server.address();
                    server.close(() => {
                        resolve(port);
                    });
                });
            });
        });
        const port = (yield inner());
        return port;
    });
}
exports.getRandomPort = getRandomPort;
function getHostIp() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new Promise((resolve) => {
            dns_1.default.lookup(os_1.default.hostname(), (_err, addr) => {
                resolve(addr);
            });
        });
    });
}
exports.getHostIp = getHostIp;
function downloadFile(url, dest) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { body } = yield fetch(url);
            const writable = fs_1.default.createWriteStream(dest);
            const readable = stream_1.Readable.fromWeb(body);
            yield (0, promises_1.finished)(readable.pipe(writable));
        }
        catch (err) {
            console.log(`\n ${colors_1.decorators.red("Unexpected error: ")} \t ${colors_1.decorators.bright(err)}\n`);
        }
    });
}
exports.downloadFile = downloadFile;
