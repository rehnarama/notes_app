import IConnection from "./IConnection";
import Hook from "./Hook";

export default interface INetwork {
  localId?: number;
  loopback?: IConnection;
  connections: IConnection[];
  pendingConnections: IConnection[];
  onConnection: Hook<(connection: IConnection) => void>;
  onPendingConnection: Hook<(connection: IConnection) => void>;
}
