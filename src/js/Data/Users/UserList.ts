import {
  INetwork,
  IConnection,
  BasicBroadcast,
  Hook,
  ConnectionChannel
} from "network";
import User from "./User";

interface JoinMessage {
  type: "join";
  user: User;
}
interface LeaveMessage {
  type: "leave";
  userId: User["id"];
}
type Message = JoinMessage | LeaveMessage;

const CHANNEL = "user_list";

export default class UserList {
  private fmn: INetwork;
  private channels = new Map<number, ConnectionChannel<Message>>();
  // private bb: BasicBroadcast;

  public get users(): User[] {
    return Array.from(this.userMap.values());
  }
  private userMap = new Map<string, User>();
  public onUsersUpdated = new Hook<() => void>();

  public constructor(fmn: INetwork) {
    this.fmn = fmn;
    // this.bb = new BasicBroadcast(fmn, CHANNEL);

    this.init();

    this.join("a random name");
  }

  private init() {
    for (const connection of this.fmn.connections) {
      this.onConnection(connection);
    }
    this.fmn.onConnection.add(this.onConnection.bind(this));
  }

  public dispose() {
    for (const channel of this.channels.values()) {
      channel.onMessage.remove(this.onMessage);
    }
  }

  private onConnection(connection: IConnection) {
    const channel = new ConnectionChannel<Message>(connection, CHANNEL);
    this.channels.set(connection.remoteId as number, channel);

    channel.onMessage.add(this.onMessage);
  }

  private onMessage(message: Message) {
    switch (message.type) {
      case "join":
        this.userMap.set(message.user.id, message.user);
        this.onUsersUpdated.call();
        break;
      case "leave":
        this.userMap.delete(message.userId);
        this.onUsersUpdated.call();
        break;
      default:
        throw new Error("Unknown message type");
    }
  }

  public join(name: string) {
    if (!this.fmn.localId) {
      return;
    }

    const message: JoinMessage = {
      user: { id: this.fmn.localId.toString(), name },
      type: "join"
    };

    for (const channel of this.channels.values()) {
      channel.send(message);
    }
    // this.bb.bBroadcast(message);
  }

  public leave() {
    if (!this.fmn.localId) {
      return;
    }

    const message: LeaveMessage = {
      userId: this.fmn.localId.toString(),
      type: "leave"
    };

    for (const channel of this.channels.values()) {
      channel.send(message);
    }
    // this.bb.bBroadcast(message);
  }
}
