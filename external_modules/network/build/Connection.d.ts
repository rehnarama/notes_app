import IConnection from "./IConnection";
import Hook from "./Hook";
export default class Connection implements IConnection {
    private pc?;
    private config;
    private channel?;
    onLocalIceCandidate: Hook<(iceCandidate: RTCIceCandidate) => void>;
    onConnectionStateChange: Hook<(state: RTCPeerConnectionState) => void>;
    onChannelOpen: Hook<() => void>;
    onMessage: Hook<(message: any, sender: IConnection) => void>;
    remoteId?: number;
    get connectionState(): RTCPeerConnectionState;
    constructor(remoteId: number, config?: RTCConfiguration);
    private initialise;
    private handleOnConnectionStateChange;
    private handleOnIceCandidate;
    private handleOnDataChannel;
    private setupChannel;
    private handleOnChannelOpen;
    private handleOnChannelMessage;
    setRemoteDescription: (description: RTCSessionDescriptionInit) => Promise<void>;
    createAnswer: (description: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit>;
    createOffer: () => Promise<RTCSessionDescriptionInit>;
    addRemoteIceCandidate: (candidate: RTCIceCandidate | RTCIceCandidateInit) => Promise<void>;
    send(message: string): void;
    send(message: Blob): void;
    send(message: ArrayBuffer): void;
    send(message: ArrayBufferView): void;
    close(): void;
}
//# sourceMappingURL=Connection.d.ts.map