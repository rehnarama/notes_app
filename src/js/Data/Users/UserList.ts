import { INetwork, IConnection, Hook, ConnectionChannel } from "network";
import User from "./User";

interface JoinMessage {
  type: "join";
  user: { id: User["id"]; name: User["name"] };
}
interface LeaveMessage {
  type: "leave";
  userId: User["id"];
}
type Message = JoinMessage | LeaveMessage;

const CHANNEL = "user_list";

const ADJECTIVES = ["red", "blue", "green"];
const NOUNS = ["panda", "llama", "koala"];

function randomItem<T>(arr: T[]): T {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

export default class UserList {
  private fmn: INetwork;
  private channels = new Map<number, ConnectionChannel<Message>>();

  public localName: string = `${randomItem(ADJECTIVES)} ${randomItem(NOUNS)}`;

  public get users(): User[] {
    return Array.from(this.userMap.values());
  }
  private userMap = new Map<string, User>();
  public onUsersUpdated = new Hook<() => void>();

  public constructor(fmn: INetwork) {
    this.fmn = fmn;

    this.init();
  }

  private init() {
    for (const connection of this.fmn.pendingConnections) {
      this.onConnection(connection);
    }
    this.fmn.onPendingConnection.add(this.onPendingConnection);

    for (const connection of this.fmn.connections) {
      this.onConnection(connection);
    }
    this.fmn.onConnection.add(this.onConnection);
  }

  private onPendingConnection = (connection: IConnection) => {
    const remoteId = connection.remoteId?.toString();
    if (remoteId !== undefined) {
      this.userMap.set(remoteId, {
        id: remoteId,
        name: "New user",
        state: connection.connectionState
      });
      this.onUsersUpdated.call();
    }
  };

  public dispose() {
    for (const channel of this.channels.values()) {
      channel.onMessage.remove(this.onMessage);
    }
  }

  private onConnection = (connection: IConnection) => {
    const channel = new ConnectionChannel<Message>(connection, CHANNEL);
    this.channels.set(connection.remoteId as number, channel);

    channel.onMessage.add(this.onMessage);
    this.sendNameTo(channel);

    channel.connection.onConnectionStateChange.add((state, sender) => {
      const remoteId = sender.remoteId?.toString();
      if (remoteId !== undefined) {
        const user = this.userMap.get(remoteId);
        if (user) {
          user.state = state;
          this.onUsersUpdated.call();
        }
      }
    });
  };

  private onMessage = (message: Message, from: ConnectionChannel<Message>) => {
    switch (message.type) {
      case "join":
        this.userMap.set(message.user.id, {
          ...message.user,
          state: from.connection.connectionState
        });
        this.onUsersUpdated.call();
        break;
      case "leave":
        this.userMap.delete(message.userId);
        this.onUsersUpdated.call();
        break;
      default:
        throw new Error("Unknown message type");
    }
  };

  private sendNameTo(channel: ConnectionChannel<Message>) {
    if (!this.fmn.localId) {
      return;
    }
    const message: JoinMessage = {
      user: { id: this.fmn.localId?.toString(), name: this.localName },
      type: "join"
    };
    channel.send(message);
  }

  public join(name: string) {
    this.localName = name;

    if (!this.fmn.localId) {
      return;
    }

    for (const channel of this.channels.values()) {
      this.sendNameTo(channel);
    }
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
  }
}
