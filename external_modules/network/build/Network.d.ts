import Connection from "./Connection";
export default class Network {
    private signalling;
    private allPeers;
    private connectedPeers;
    localId?: number;
    get connections(): Connection[];
    onConnection?: (connection: Connection) => void;
    /**
     * Constructs a new network
     * @param signallingUrl The url of the signalling server, e.g.
     *        ws://localhost:8080
     */
    constructor(signallingUrl: string);
    private handleOnAssignedPeerId;
    private handleOnNewPeer;
    private createNewConnection;
    private handleOnDescription;
    private handleOnIceCandidate;
    /**
     * Closes all peer connections and connection to signaling server
     */
    close(): void;
}
//# sourceMappingURL=Network.d.ts.map