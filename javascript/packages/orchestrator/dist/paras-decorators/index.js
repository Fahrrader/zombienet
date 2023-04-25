"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PARA = exports.decorate = exports.whichPara = void 0;
var PARA;
(function (PARA) {
    PARA["Statemint"] = "statemint";
    PARA["Moonbeam"] = "moonbeam";
    PARA["Efinity"] = "efinity";
    PARA["Acala"] = "acala";
    PARA["Astar"] = "astar";
    PARA["Bifrost"] = "bifrost";
    PARA["Equilibrium"] = "equilibrium";
    PARA["Oak"] = "oak";
    PARA["Mangata"] = "mangata";
    PARA["Generic"] = "generic";
})(PARA || (PARA = {}));
exports.PARA = PARA;
// imports
const acala_1 = __importDefault(require("./acala"));
const astar_1 = __importDefault(require("./astar"));
const bifrost_1 = __importDefault(require("./bifrost"));
const efinity_1 = __importDefault(require("./efinity"));
const equilibrium_1 = __importDefault(require("./equilibrium"));
const mangata_1 = __importDefault(require("./mangata"));
const moonbeam_1 = __importDefault(require("./moonbeam"));
const oak_1 = __importDefault(require("./oak"));
const statemint_1 = __importDefault(require("./statemint"));
function whichPara(chain) {
    if (chain.includes("statemint"))
        return PARA.Statemint;
    if (/moonbase|moonriver|moonbeam/.test(chain))
        return PARA.Moonbeam;
    if (/efinity|rocfinity/.test(chain))
        return PARA.Efinity;
    if (/acala|karura|mandala/.test(chain))
        return PARA.Acala;
    if (/astar|shiden|shibuya/.test(chain))
        return PARA.Astar;
    if (/bifrost/.test(chain))
        return PARA.Bifrost;
    if (/equilibrium|genshiro/.test(chain))
        return PARA.Equilibrium;
    if (/oak|turing|neumann/.test(chain))
        return PARA.Oak;
    if (/mangata/.test(chain))
        return PARA.Mangata;
    return PARA.Generic;
}
exports.whichPara = whichPara;
const moonbeamDecorators = Object.keys(moonbeam_1.default).reduce((memo, fn) => {
    memo[fn] = moonbeam_1.default[fn];
    return memo;
}, Object.create({}));
const statemintDecorators = Object.keys(statemint_1.default).reduce((memo, fn) => {
    memo[fn] = statemint_1.default[fn];
    return memo;
}, Object.create({}));
const efinityDecorators = Object.keys(efinity_1.default).reduce((memo, fn) => {
    memo[fn] = efinity_1.default[fn];
    return memo;
}, Object.create({}));
const acalaDecorators = Object.keys(acala_1.default).reduce((memo, fn) => {
    memo[fn] = acala_1.default[fn];
    return memo;
}, Object.create({}));
const astarDecorators = Object.keys(astar_1.default).reduce((memo, fn) => {
    memo[fn] = astar_1.default[fn];
    return memo;
}, Object.create({}));
const bifrostDecorators = Object.keys(bifrost_1.default).reduce((memo, fn) => {
    memo[fn] = bifrost_1.default[fn];
    return memo;
}, Object.create({}));
const eqDecorators = Object.keys(equilibrium_1.default).reduce((memo, fn) => {
    memo[fn] = equilibrium_1.default[fn];
    return memo;
}, Object.create({}));
const oakDecorators = Object.keys(oak_1.default).reduce((memo, fn) => {
    memo[fn] = oak_1.default[fn];
    return memo;
}, Object.create({}));
const mangataDecorators = Object.keys(mangata_1.default).reduce((memo, fn) => {
    memo[fn] = mangata_1.default[fn];
    return memo;
}, Object.create({}));
const decorators = {
    moonbeam: moonbeamDecorators,
    statemint: statemintDecorators,
    efinity: efinityDecorators,
    acala: acalaDecorators,
    astar: astarDecorators,
    bifrost: bifrostDecorators,
    equilibrium: eqDecorators,
    oak: oakDecorators,
    mangata: mangataDecorators,
    generic: {},
};
function decorate(para, fns) {
    const decorated = fns.map((fn) => {
        return decorators[para][fn.name] ? decorators[para][fn.name] : fn;
    });
    return decorated;
}
exports.decorate = decorate;
