import { ZombieRoleLabel } from "../../../types";
import { NodeResource } from "./nodeResource";
import { NodeSpec, Port, ProcessEnvironment } from "./types";
export declare class BootNodeResource extends NodeResource {
    protected createDirectories(): Promise<void>;
    protected generateCommand(): Promise<string[]>;
    protected getZombieRoleLabel(): ZombieRoleLabel;
    protected generateNodeSpec(ports: Port[], command: string[], zombieRole: ZombieRoleLabel, env: ProcessEnvironment): NodeSpec;
}
