import WS, { Server as WSS } from "ws";
import SignallingMessage, {
  SignallingEvent,
  NewPeer,
  Pong,
  Description,
  IceCandidate,
  AssignedPeerId
} from "./SignallingMessage";

export enum ReadyState {
  WAITING,
  OPEN,
  ERROR
}

const DEFAULT_PORT = parseInt(process.env.PORT ?? "8080");

export default class SignallingServer {
  private wss: WSS;

  public state: ReadyState;

  private peers = new Map<number, WS>();
  private idClock = 0;

  public get numberOfPeers() {
    return this.peers.size;
  }

  constructor(port = DEFAULT_PORT) {
    this.state = ReadyState.WAITING;
    this.wss = new WSS({ port }, () => {
      this.state = ReadyState.OPEN;
    });

    this.wss.on("connection", this.onConnection);
  }

  private getId() {
    const id = this.idClock;
    this.idClock++;
    return id;
  }

  onConnection = (socket: WS) => {
    const id = this.getId();
    this.peers.set(id, socket);

    const assignedPeerId = new AssignedPeerId(id);
    this.send(assignedPeerId, id);
    const newPeerMessage = new NewPeer(id);
    this.broadcast(newPeerMessage, id);

    socket.onmessage = ({ data: stringData }) => {
      if (typeof stringData === "string") {
        const message = SignallingMessage.fromJson(stringData);
        if (message.isPing()) {
          socket.send(new Pong().toJson());
        }
        if (message.isDescription()) {
          this.send(
            new Description(message.remoteDescription, id),
            message.peerId
          );
        }
        if (message.isIceCandidate()) {
          this.send(new IceCandidate(message.iceCandidate, id), message.peerId);
        }
      } else {
        throw new Error("Data was not string. Aborting");
      }
    };

    socket.onclose = () => {
      this.peers.delete(id);
    };
  };

  broadcast(message: SignallingMessage | string, except?: number) {
    for (const id of this.peers.keys()) {
      if (except === undefined || except !== id) {
        this.send(message, id);
      }
    }
  }

  send(message: SignallingMessage | string, peerId: number) {
    const data = typeof message === "string" ? message : message.toJson();
    const ws = this.peers.get(peerId);
    if (ws) {
      ws.send(data);
    }
  }

  async close() {
    return new Promise((resolve, reject) => {
      this.wss.close(err => {
        if (err) {
          reject();
        } else {
          resolve();
        }
      });
    });
  }
}
