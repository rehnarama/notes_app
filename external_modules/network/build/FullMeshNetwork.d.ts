import { Signalling } from "signalling";
import Connection from "./Connection";
import INetwork from "./INetwork";
import IConnection from "./IConnection";
import Hook from "./Hook";
export default class FullMeshNetwork implements INetwork {
    private signalling;
    private allPeers;
    private connectedPeers;
    localId?: number;
    get connections(): Connection[];
    onConnection: Hook<(connection: IConnection) => void>;
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
    toJSON(): {
        signalling: Signalling;
        allPeers: [number, Connection][];
        connectedPeers: [number, Connection][];
        localId: number | undefined;
    };
}
//# sourceMappingURL=FullMeshNetwork.d.ts.map