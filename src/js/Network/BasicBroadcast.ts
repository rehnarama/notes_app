import INetwork from "./INetwork";
import IConnection from "./IConnection";
import Hook from "./Hook";

export default class BasicBroadcast {
  protected network: INetwork;
  private header: string;

  private isOffline = false;
  private offlineSendBuffer: any[] = [];
  private offlineReceiveBuffer: any[] = [];

  /**
   * If set to true, messages will be buffered to simulate an offline connection
   */
  public setOffline(isOffline: boolean) {
    this.isOffline = isOffline;
    if (!isOffline) {
      this.processOfflineBuffer();
    }
  }

  public constructor(network: INetwork, header = "BB") {
    this.network = network;
    this.header = header;

    for (const connection of this.network.connections) {
      this.handleOnConnection(connection);
    }
    this.network.onConnection.add(this.handleOnConnection);
  }

  private handleOnConnection = (connection: IConnection) => {
    connection.onMessage.add(this.receive);
  };

  private processOfflineBuffer() {
    // We store the buffer localy temporarily
    const sendBuffer = this.offlineSendBuffer;
    const receiveBuffer = this.offlineReceiveBuffer;
    // and create new buffer here, since broadcast/receive-function mutates
    // the offline buffer, we don't want to reset it AFTER calling broadcast
    this.offlineSendBuffer = [];
    this.offlineReceiveBuffer = [];

    for (const msg of sendBuffer) {
      this.bBroadcast(msg);
    }
    for (const data of receiveBuffer) {
      this.receive(data);
    }
  }

  public bBroadcast(message: any) {
    if (this.isOffline) {
      this.offlineSendBuffer.push(message);
    } else {
      const payload = [this.header, message];
      const data = JSON.stringify(payload);

      // We can always basic deliver to ourself directly on broadcast
      this.receive(data);

      for (const connection of this.network.connections) {
        connection.send(data);
      }
    }
  }

  private receive = (data: any) => {
    if (this.isOffline) {
      this.offlineReceiveBuffer.push(data);
    } else {
      const payload = JSON.parse(data);
      if (Array.isArray(payload) && payload[0] === this.header) {
        const message = payload[1];
        this.bDeliver.call(message);
      }
    }
  };

  public bDeliver = new Hook<(message: any) => void>();

  public toJSON() {
    return {};
  }
}
