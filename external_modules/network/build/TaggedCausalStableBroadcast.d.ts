import CausalBroadcast from "./CausalBroadcast";
import INetwork from "./INetwork";
import VectorClock from "./VectorClock";
import Hook from "./Hook";
export default class TaggedCausalStableBroadcast extends CausalBroadcast {
    /**
     * Map from peer id to timestamp
     */
    private delivered;
    private unstable;
    /**
     * Hooks that is called when a timestamp is considered to be causally stable
     */
    tcsStable: Hook<(timestamp: VectorClock) => void>;
    tcsDeliver: Hook<(message: any, timestamp: VectorClock) => void>;
    constructor(network: INetwork, header?: string);
    /**
     * Overridden hook from CausalBroadcast
     */
    private onTCDeliver;
    tcsBroadcast(message: any): void;
    private checkStability;
    private isStable;
    /**
     * Gives the greatest lower bound on messages issued at j delivered at each
     * other node
     */
    private lowerBound;
    toJSON(): any;
}
//# sourceMappingURL=TaggedCausalStableBroadcast.d.ts.map