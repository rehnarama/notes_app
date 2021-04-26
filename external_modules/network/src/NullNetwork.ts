import Hook from "./Hook";
import IConnection from "./IConnection";
import INetwork from "./INetwork";

export default class NullNetwork implements INetwork {
  localId?: number | undefined;
  connections: IConnection[] = [];
  pendingConnections: IConnection[] = [];
  onConnection: Hook<(connection: IConnection) => void> = new Hook();
  onPendingConnection: Hook<(connection: IConnection) => void> = new Hook();
}
