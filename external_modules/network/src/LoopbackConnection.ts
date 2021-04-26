import IConnection, { ConnectionState } from "./IConnection";
import Hook from "./Hook";

export default class LoopbackConnection implements IConnection {
  public onChannelOpen = new Hook<() => void>();

  public onMessage = new Hook<(message: any, sender: IConnection) => void>();
  public onConnectionStateChange = new Hook<
    (state: ConnectionState, sender: IConnection) => void
  >();

  public remoteId?: number;

  public connectionState: ConnectionState = "connected";

  constructor(localId: number) {
    this.remoteId = localId;
    setTimeout(() => {
      this.onChannelOpen.call();
    }, 0);
  }

  public send(message: string): void;
  public send(message: Blob): void;
  public send(message: ArrayBuffer): void;
  public send(message: ArrayBufferView): void;
  public send(message: string | Blob | ArrayBuffer | ArrayBufferView) {
    this.onMessage.call(message, this);
  }

  public close() {
    this.connectionState = "closed";
  }
}
