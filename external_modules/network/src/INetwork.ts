import IConnection from "./IConnection";
import Hook from "./Hook";

export default interface INetwork {
  localId?: number;
  loopback?: IConnection;
  connections: IConnection[];
  onConnection: Hook<(connection: IConnection) => void>;
}
