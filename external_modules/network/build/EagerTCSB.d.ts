import CausalBroadcast from "./CausalBroadcast";
import INetwork from "./INetwork";
import VectorClock from "./VectorClock";
import Hook from "./Hook";
export default class EagerTCSB extends CausalBroadcast {
    /**
     * This map keeps tracks of how many ACKs a local message has received from
     * remote peers
     */
    private unstableAckCount;
    private ackQueue;
    /**
     * Hooks that is called when a timestamp is considered to be causally stable
     */
    tcsStable: Hook<(timestamp: VectorClock) => void>;
    tcsDeliver: Hook<(message: any, timestamp: VectorClock) => void>;
    constructor(network: INetwork, header?: string);
    private handleOnMessage;
    private processAckQueue;
    private sendAck;
    private shareStablilityInfo;
    private checkStability;
    private markStable;
    tcsBroadcast: (message: any) => void;
    /**
     * Overridden hook from CausalBroadcast
     */
    private onTCDeliver;
    toJSON(): any;
}
//# sourceMappingURL=EagerTCSB.d.ts.map