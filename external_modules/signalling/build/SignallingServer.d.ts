import WS from "ws";
import SignallingMessage from "./SignallingMessage";
export declare enum ReadyState {
    WAITING = 0,
    OPEN = 1,
    ERROR = 2
}
export default class SignallingServer {
    private wss;
    state: ReadyState;
    private peers;
    private idClock;
    get numberOfPeers(): number;
    constructor(port?: number);
    private getId;
    onConnection: (socket: WS) => void;
    broadcast(message: SignallingMessage | string, except?: number): void;
    send(message: SignallingMessage | string, peerId: number): void;
    close(): Promise<unknown>;
}
//# sourceMappingURL=SignallingServer.d.ts.map