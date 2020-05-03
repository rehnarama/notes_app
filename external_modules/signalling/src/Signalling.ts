import WebSocket, { CloseEvent, MessageEvent } from "isomorphic-ws";
import SignallingMessage, {
  NewPeer,
  Description,
  IceCandidate,
  AssignedPeerId,
  JoinRoom
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

  public async connect(url: string) {
    return new Promise(res => {
      this.ws = new WebSocket(url);
      this.ws.onopen = () => {
        this.handleOnOpen();
        res();
      };
      this.ws.onclose = this.handleOnClose;
      this.ws.onmessage = this.handleOnMessage;
    });
  }

  public joinRoom(roomId: string) {
    if (this.ws) {
      this.ws.send(new JoinRoom(roomId).toJson());
    }
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
