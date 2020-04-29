import SignallingMessage, { NewPeer, Description, IceCandidate, AssignedPeerId } from "./SignallingMessage";
export declare type AssignedPeerIdHandler = (assignedPeerId: AssignedPeerId) => void;
export declare type NewPeerHandler = (newPeer: NewPeer) => void;
export declare type DescriptionHandler = (description: Description) => void;
export declare type IceCandidateHandler = (iceCandidate: IceCandidate) => void;
export default class Signalling {
    private ws?;
    get readyState(): number | undefined;
    onAssignedPeerId?: AssignedPeerIdHandler;
    onNewPeer?: NewPeerHandler;
    onDescription?: DescriptionHandler;
    onIceCandidate?: IceCandidateHandler;
    onOpen?: () => void;
    onClose?: () => void;
    constructor(onAssignedPeerId?: AssignedPeerIdHandler, onNewPeer?: NewPeerHandler, onDescription?: DescriptionHandler, onIceCandidate?: IceCandidateHandler);
    connect(url: string): void;
    close(): void;
    private handleOnOpen;
    private handleOnClose;
    private handleOnMessage;
    send: (message: SignallingMessage) => void;
}
//# sourceMappingURL=Signalling.d.ts.map