import INetwork from "./INetwork";
import Hook from "./Hook";
export default class BasicBroadcast {
    protected network: INetwork;
    private header;
    private isOffline;
    private offlineSendBuffer;
    private offlineReceiveBuffer;
    /**
     * If set to true, messages will be buffered to simulate an offline connection
     */
    setOffline(isOffline: boolean): void;
    constructor(network: INetwork, header?: string);
    private handleOnConnection;
    private processOfflineBuffer;
    bBroadcast(message: any): void;
    private broadcast;
    private receive;
    bDeliver: Hook<(message: any) => void>;
    toJSON(): {};
}
//# sourceMappingURL=BasicBroadcast.d.ts.map