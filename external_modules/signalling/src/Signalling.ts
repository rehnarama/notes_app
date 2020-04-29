import WebSocket, { CloseEvent, MessageEvent } from "isomorphic-ws";
import SignallingMessage, {
  NewPeer,
  Description,
  IceCandidate,
  AssignedPeerId
} from "./SignallingMessage";

export type AssignedPeerIdHandler = (assignedPeerId: AssignedPeerId) => void;
export type NewPeerHandler = (newPeer: NewPeer) => void;
export type DescriptionHandler = (description: Description) => void;
export type IceCandidateHandler = (iceCandidate: IceCandidate) => void;

export default class Signalling {
  private ws?: WebSocket;

  public get readyState() {
    return this.ws?.readyState;
  }

  public onAssignedPeerId?: AssignedPeerIdHandler;
  public onNewPeer?: NewPeerHandler;
  public onDescription?: DescriptionHandler;
  public onIceCandidate?: IceCandidateHandler;

  public onOpen?: () => void;
  public onClose?: () => void;

  constructor(
    onAssignedPeerId?: AssignedPeerIdHandler,
    onNewPeer?: NewPeerHandler,
    onDescription?: DescriptionHandler,
    onIceCandidate?: IceCandidateHandler
  ) {
    this.onAssignedPeerId = onAssignedPeerId;
    this.onNewPeer = onNewPeer;
    this.onDescription = onDescription;
    this.onIceCandidate = onIceCandidate;
  }

  public connect(url: string) {
    this.ws = new WebSocket(url);
    this.ws.onopen = this.handleOnOpen;
    this.ws.onclose = this.handleOnClose;
    this.ws.onmessage = this.handleOnMessage;
  }

  close() {
    this.ws?.close();
  }

  private handleOnOpen = () => {
    this.onOpen?.();
  };

  private handleOnClose = (_: CloseEvent) => {
    this.onClose?.();
  };

  private handleOnMessage = (event: MessageEvent) => {
    if (typeof event.data === "string") {
      const msg = SignallingMessage.fromJson(event.data);
      if (msg.isNewPeer()) {
        this.onNewPeer?.(msg);
      }
      if (msg.isDescription()) {
        this.onDescription?.(msg);
      }
      if (msg.isIceCandidate()) {
        this.onIceCandidate?.(msg);
      }
      if (msg.isAssignedPeerId()) {
        this.onAssignedPeerId?.(msg);
      }
    }
  };

  public send = (message: SignallingMessage) => {
    this.ws?.send(message.toJson());
  };
}
