"use strict";
// Launch Config, there are used user-input
// mapped from the json/toml to compute the
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubstrateCliArgsVersion = exports.ZombieRole = void 0;
var ZombieRole;
(function (ZombieRole) {
    ZombieRole["Temp"] = "temp";
    ZombieRole["Node"] = "node";
    ZombieRole["BootNode"] = "bootnode";
    ZombieRole["Collator"] = "collator";
    ZombieRole["CumulusCollator"] = "cumulus-collator";
})(ZombieRole = exports.ZombieRole || (exports.ZombieRole = {}));
var SubstrateCliArgsVersion;
(function (SubstrateCliArgsVersion) {
    SubstrateCliArgsVersion[SubstrateCliArgsVersion["V0"] = 0] = "V0";
    SubstrateCliArgsVersion[SubstrateCliArgsVersion["V1"] = 1] = "V1";
})(SubstrateCliArgsVersion = exports.SubstrateCliArgsVersion || (exports.SubstrateCliArgsVersion = {}));
