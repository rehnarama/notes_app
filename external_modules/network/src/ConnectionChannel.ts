import Hook from "./Hook";
import IConnection from "./IConnection";

export default class ConnectionChannel<T = unknown> {
  public connection: IConnection;
  private channel: string;

  public onMessage = new Hook<
    (message: T, from: ConnectionChannel<T>) => void
  >();

  public constructor(connection: IConnection, channel: string) {
    this.connection = connection;
    this.connection.onMessage.add(this.handleOnMessage.bind(this));
    this.channel = channel;
  }

  private handleOnMessage(data: any, sender: IConnection) {
    const payload = JSON.parse(data);
    if (Array.isArray(payload)) {
      if (payload[0] === this.channel) {
        const message = payload[1];
        if (sender.remoteId === undefined) {
          throw new Error("Sender doesn t have a remote id!");
        }
        this.onMessage.call(message, this);
      }
    }
  }

  public send(message: unknown) {
    const payload = [this.channel, message];
    const data = JSON.stringify(payload);
    this.connection.send(data);
  }
}
