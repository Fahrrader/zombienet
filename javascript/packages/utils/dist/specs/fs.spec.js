"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const chai_1 = __importStar(require("chai"));
const deep_equal_in_any_order_1 = __importDefault(require("deep-equal-in-any-order"));
const fs_2 = require("../fs");
chai_1.default.use(deep_equal_in_any_order_1.default);
describe("Tests on module 'fs';", () => {
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, fs_1.mkdir)(path_1.default.join(__dirname, "tmp_tests"), (err) => {
                if (err) {
                    return console.error(err);
                }
            });
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            (0, fs_1.rmSync)(path_1.default.join(__dirname, "tmp_tests"), { recursive: true, force: true });
        });
    });
    it("tests that fs/writeLocalJsonFile is success ", () => __awaiter(void 0, void 0, void 0, function* () {
        const jsonTest = {
            apiVersion: "v1",
            kind: "Namespace",
            metadata: {
                name: "this.namespace",
            },
        };
        const writeFn = () => (0, fs_2.writeLocalJsonFile)(path_1.default.join(__dirname, "tmp_tests"), "writeLocalJsonFile.json", jsonTest);
        (0, chai_1.expect)(writeFn).to.not.throw();
        (0, fs_1.readFile)(path_1.default.join(__dirname, "tmp_tests", "writeLocalJsonFile.json"), "utf8", (err, data) => {
            if (err) {
                console.error(err);
            }
            else {
                (0, chai_1.expect)(JSON.parse(data)).to.deep.equalInAnyOrder(jsonTest);
            }
        });
    }));
    it("tests that fs/readNetworkConfig converts the config file", () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const some = path_1.default.resolve(path_1.default.join(__dirname, "./spec-config.toml"));
        const s = (0, fs_2.readNetworkConfig)(some);
        chai_1.assert.equal((_a = s === null || s === void 0 ? void 0 : s.relaychain) === null || _a === void 0 ? void 0 : _a.default_image, "test-image");
        chai_1.assert.equal((_b = s === null || s === void 0 ? void 0 : s.relaychain) === null || _b === void 0 ? void 0 : _b.default_command, "test-polkadot");
        if ((_c = s === null || s === void 0 ? void 0 : s.relaychain) === null || _c === void 0 ? void 0 : _c.default_args) {
            const arg = (_d = s === null || s === void 0 ? void 0 : s.relaychain) === null || _d === void 0 ? void 0 : _d.default_args[0];
            chai_1.assert.equal(arg, "-lparachain=test");
        }
        chai_1.assert.equal((_e = s === null || s === void 0 ? void 0 : s.relaychain) === null || _e === void 0 ? void 0 : _e.chain, "test-rococo");
        const node = ((_f = s === null || s === void 0 ? void 0 : s.relaychain) === null || _f === void 0 ? void 0 : _f.nodes) && ((_g = s === null || s === void 0 ? void 0 : s.relaychain) === null || _g === void 0 ? void 0 : _g.nodes[0]);
        chai_1.assert.notEqual(node, undefined);
        node && chai_1.assert.equal(node.name, "alice");
        chai_1.assert.equal((_h = s === null || s === void 0 ? void 0 : s.relaychain) === null || _h === void 0 ? void 0 : _h.default_command, "test-polkadot");
    }));
});
