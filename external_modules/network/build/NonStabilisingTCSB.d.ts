import CausalBroadcast, { CausalMessage } from "./CausalBroadcast";
import VectorClock from "./VectorClock";
import INetwork from "./INetwork";
import Hook from "./Hook";
export default class NonStabilisingTCSB extends CausalBroadcast {
    tcsStable: Hook<(timestamp: VectorClock) => void>;
    tcsDeliver: Hook<(message: any, timestamp: VectorClock) => void>;
    constructor(network: INetwork, header?: string);
    private onTCDeliver;
    tcsBroadcast(message: any): void;
    toJSON(): {
        clock: VectorClock;
        queue: CausalMessage[];
    };
}
//# sourceMappingURL=NonStabilisingTCSB.d.ts.map