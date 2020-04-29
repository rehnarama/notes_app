import CausalBroadcast from "./CausalBroadcast";
import INetwork from "./INetwork";
import VectorClock from "./VectorClock";
import Hook from "./Hook";
export default class ManualTCSB extends CausalBroadcast {
    /**
     * Map from peer id to timestamp
     */
    private delivered;
    /**
     * Hooks that is called when a timestamp is considered to be causally stable
     */
    tcsStable: Hook<(timestamp: VectorClock) => void>;
    tcsDeliver: Hook<(message: any, timestamp: {
        clock: VectorClock;
        source: number;
    }) => void>;
    constructor(network: INetwork, header?: string);
    /**
     * Overridden hook from CausalBroadcast
     */
    private onTCDeliver;
    tcsBroadcast(message: any): void;
    checkStability(messages: Array<{
        clock: VectorClock;
        source: number;
    }>): void;
    private isStable;
    /**
     * Gives the greatest lower bound on messages issued at j delivered at each
     * other node
     */
    private lowerBound;
    toJSON(): any;
}
//# sourceMappingURL=ManualTCSB.d.ts.map