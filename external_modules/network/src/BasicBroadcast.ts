import INetwork from "./INetwork";
import IConnection from "./IConnection";
import Hook from "./Hook";
import ConnectionChannel from "./ConnectionChannel";

export default class BasicBroadcast<T = any> {
  protected network: INetwork;
  private header: string;

  public bDeliver = new Hook<
    (message: T, from: IConnection) => void
  >();

  private channels: ConnectionChannel<T>[] = [];

  public constructor(network: INetwork, header = "BB") {
    this.network = network;
    this.header = header;

    for (const connection of this.network.connections) {
      this.handleOnConnection(connection);
    }
    this.network.onConnection.add(this.handleOnConnection);
  }

  private handleOnConnection = (connection: IConnection) => {
    const channel = new ConnectionChannel<T>(connection, this.header);
    this.channels.push(channel);
    channel.onMessage.add(this.receive);
  };

  public bBroadcast(message: T) {
    // We can always basic deliver to ourself directly on broadcast
    this.bDeliver.call(message, this.network.loopback as IConnection);

    this.broadcast(message);
  }

  private broadcast(message: any) {
    const payload = [this.header, message];
    const data = JSON.stringify(payload);

    for (const connection of this.network.connections) {
      connection.send(data);
    }
  }

  private receive = (data: T, from: ConnectionChannel<T>) => {
    this.bDeliver.call(data, from.connection);
  };

  public toJSON() {
    return {};
  }
}
