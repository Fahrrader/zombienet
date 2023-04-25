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
exports.BootNodeResource = void 0;
const utils_1 = require("@zombienet/utils");
const cmdGenerator_1 = require("../../../cmdGenerator");
const types_1 = require("../../../types");
const nodeResource_1 = require("./nodeResource");
class BootNodeResource extends nodeResource_1.NodeResource {
    createDirectories() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield (0, utils_1.makeDir)(this.configPath, true);
                yield (0, utils_1.makeDir)(this.dataPath, true);
            }
            catch (_a) {
                throw new Error(`Error generating directories for ${this.nodeSetupConfig.name} resource`);
            }
        });
    }
    generateCommand() {
        return (0, cmdGenerator_1.genCmd)(this.nodeSetupConfig, this.configPath, this.dataPath, false);
    }
    getZombieRoleLabel() {
        return types_1.ZombieRole.BootNode;
    }
    generateNodeSpec(ports, command, zombieRole, env) {
        return {
            metadata: {
                name: "bootnode",
                namespace: this.namespace,
                labels: {
                    name: this.namespace,
                    instance: "bootnode",
                    "zombie-role": zombieRole,
                    app: "zombienet",
                    "zombie-ns": this.namespace,
                },
            },
            spec: {
                cfgPath: this.configPath,
                ports,
                command,
                env,
            },
        };
    }
}
exports.BootNodeResource = BootNodeResource;
