export declare enum SignallingEvent {
    PING = 0,
    PONG = 1,
    NEW_PEER = 2,
    DESCRIPTION = 3,
    ICE_CANDIDATE = 4,
    ASSIGNED_PEER_ID = 5
}
export default abstract class SignallingMessage {
    event: SignallingEvent;
    args?: any[];
    constructor(event: SignallingEvent, args?: any[]);
    toJson(): string;
    isPing(): this is Ping;
    isPong(): this is Pong;
    isNewPeer(): this is NewPeer;
    isDescription(): this is Description;
    isIceCandidate(): this is IceCandidate;
    isAssignedPeerId(): this is AssignedPeerId;
    static fromJson(json: string): Ping | Pong | NewPeer | Description | IceCandidate | AssignedPeerId;
}
export declare class Ping extends SignallingMessage {
    constructor();
}
export declare class Pong extends SignallingMessage {
    constructor();
}
export declare class NewPeer extends SignallingMessage {
    peerId: number;
    constructor(peerId: number);
}
export declare class Description extends SignallingMessage {
    remoteDescription: RTCSessionDescriptionInit;
    peerId: number;
    constructor(remoteDescription: RTCSessionDescriptionInit, peerId: number);
}
export declare class IceCandidate extends SignallingMessage {
    iceCandidate: RTCIceCandidateInit | RTCIceCandidate;
    peerId: number;
    constructor(iceCandidate: RTCIceCandidateInit | RTCIceCandidate, peerId: number);
}
export declare class AssignedPeerId extends SignallingMessage {
    peerId: number;
    constructor(peerId: number);
}
//# sourceMappingURL=SignallingMessage.d.ts.map