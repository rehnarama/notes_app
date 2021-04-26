import INetwork from "../INetwork";
import IConnection, { ConnectionState } from "../IConnection";
import Hook from "../Hook";

export class MockConnection implements IConnection {
  remoteId?: number;
  connectionState: ConnectionState = "new";
  onMessage = new Hook<(message: any, sender: IConnection) => void>();
  onConnectionStateChange = new Hook<
    (state: ConnectionState, sender: IConnection) => void
  >();

  private peer?: MockConnection;

  constructor(remoteId: number) {
    this.remoteId = remoteId;
  }

  private buffer: any[] = [];

  send(message: string): void;
  send(message: Blob): void;
  send(message: ArrayBuffer): void;
  send(message: ArrayBufferView): void;
  send(message: any) {
    this.buffer.push(message);
  }
  close(): void {
    this.connectionState = "closed";
  }

  public deliver() {
    if (this.peer !== undefined) {
      for (const msg of this.buffer) {
        this.peer.onMessage.call(msg, this);
      }
      this.buffer = [];
    }
  }

  public static createConnections(id1: number, id2: number) {
    const c1 = new MockConnection(id2); // Remote id will be the OTHER connection
    const c2 = new MockConnection(id1); // hence the flipped 1 & 2
    c1.peer = c2;
    c2.peer = c1;
    return [c1, c2];
  }
}

export default class MockNetwork implements INetwork {
  localId: number;

  constructor(localId: number) {
    this.localId = localId;
  }

  public connect(other: MockNetwork) {
    const [c1, c2] = MockConnection.createConnections(
      this.localId,
      other.localId
    );

    this.connections.push(c1);
    other.connections.push(c2);

    this.onPendingConnection.call(c1);
    other.onPendingConnection.call(c2);

    this.onConnection.call(c1);
    other.onConnection.call(c2);
  }

  public deliver(peers?: number[]) {
    for (const c of this.connections) {
      if (peers === undefined || peers.indexOf(c.remoteId || -1) !== -1) {
        c.deliver();
      }
    }
  }

  connections: MockConnection[] = [];
  pendingConnections: MockConnection[] = [];
  onConnection = new Hook<(connection: IConnection) => void>();
  onPendingConnection = new Hook<(connection: IConnection) => void>();
}
