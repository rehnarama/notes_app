import Hook from "./Hook";

export type ConnectionState =
  | "new"
  | "checking"
  | "connecting"
  | "completed"
  | "connected"
  | "disconnected"
  | "failed"
  | "closed";

export default interface IConnection {
  remoteId?: number;
  connectionState: ConnectionState;
  onConnectionStateChange: Hook<
    (state: ConnectionState, sender: IConnection) => void
  >;
  onMessage: Hook<(message: any, sender: IConnection) => void>;
  send(message: string): void;
  send(message: Blob): void;
  send(message: ArrayBuffer): void;
  send(message: ArrayBufferView): void;
  close(): void;
}
