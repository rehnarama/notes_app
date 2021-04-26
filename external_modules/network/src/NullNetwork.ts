import Hook from "./Hook";
import IConnection from "./IConnection";
import INetwork from "./INetwork";

export default class NullNetwork implements INetwork {
  localId?: number | undefined;
  connections: IConnection[] = [];
  onConnection: Hook<(connection: IConnection) => void> = new Hook();
}
