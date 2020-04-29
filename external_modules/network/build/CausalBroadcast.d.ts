import BasicBroadcast from "./BasicBroadcast";
import VectorClock from "./VectorClock";
import INetwork from "./INetwork";
import Hook from "./Hook";
export interface CausalMessage {
    message: any;
    timestamp: {
        id: number;
        clock: string;
    };
}
export default class CausalBroadcast extends BasicBroadcast {
    protected clock: VectorClock;
    private queue;
    cDeliver: Hook<(message: any) => void>;
    tcDeliver: Hook<(msg: CausalMessage) => void>;
    constructor(network: INetwork, header?: string);
    cBroadcast(message: any): void;
    private onBasicDeliver;
    private processQueue;
    private isReadyToDeliver;
    toJSON(): {
        clock: VectorClock;
        queue: CausalMessage[];
    };
}
//# sourceMappingURL=CausalBroadcast.d.ts.map