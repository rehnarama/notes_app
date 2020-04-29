import BasicBroadcast from "./BasicBroadcast";
import VectorClock from "./VectorClock";
import INetwork from "./INetwork";
import Hook from "./Hook";

export interface CausalMessage {
  message: any;
  timestamp: {
    id: number;
    clock: string;
  };
}

export default class CausalBroadcast extends BasicBroadcast {
  protected clock: VectorClock;

  private queue: CausalMessage[] = [];

  public cDeliver = new Hook<(message: any) => void>();
  public tcDeliver = new Hook<(msg: CausalMessage) => void>();

  public constructor(network: INetwork, header = "CC") {
    super(network, header);
    // connections.length === number of remote connections, +1 to include local
    // peer
    this.clock = new VectorClock(network.connections.length + 1);
    this.bDeliver.add(this.onBasicDeliver);
  }

  public cBroadcast(message: any) {
    const localId = this.network.localId;
    if (localId === undefined) {
      throw new Error("No local id found. Aborting broadcast");
    }

    this.clock.set(localId, this.clock.get(localId) + 1);
    const causalMessage: CausalMessage = {
      message,
      timestamp: {
        id: localId,
        clock: this.clock.toJson()
      }
    };
    super.bBroadcast(causalMessage);
  }

  private onBasicDeliver = (msg: CausalMessage) => {
    const localId = this.network.localId;
    const remoteId = msg.timestamp.id;
    if (localId === undefined) {
      throw new Error("No local id found. Aborting deliver");
    }

    if (remoteId === localId) {
      // We can always deliver to ourselves
      this.tcDeliver.call(msg);
      this.cDeliver.call(msg.message);
    } else {
      this.queue.push(msg);
      this.processQueue();
    }
  };

  private processQueue() {
    let runAgain;

    do {
      runAgain = false;

      for (let i = this.queue.length - 1; i >= 0; i--) {
        // Start from end so we don't have to deal with side effect if we remove
        // a message from the queue
        const msg = this.queue[i];

        if (this.isReadyToDeliver(msg)) {
          // We only have to run again if we are not in the end of the queue
          // since we'll process all messages in the queue anyway
          runAgain = i !== this.queue.length - 1;

          this.queue.splice(i, 1);
          this.clock.set(
            msg.timestamp.id,
            this.clock.get(msg.timestamp.id) + 1
          );
          this.tcDeliver.call(msg);
          this.cDeliver.call(msg.message);
        }
      }
    } while (runAgain);
  }

  private isReadyToDeliver = (message: CausalMessage) => {
    const { id: remoteId, clock: jsonClock } = message.timestamp;
    const remoteClock = VectorClock.fromJson(jsonClock);
    const localClock = this.clock;

    const isNextFromRemote =
      remoteClock.get(remoteId) === localClock.get(remoteId) + 1;

    let isCausallyOrderedBefore = true;
    for (let i = 0; i < this.clock.size; i++) {
      if (remoteClock.get(i) > localClock.get(i) && i !== remoteId) {
        isCausallyOrderedBefore = false;
        break;
      }
    }

    return isNextFromRemote && isCausallyOrderedBefore;
  };

  public toJSON() {
    return {
      clock: this.clock,
      queue: this.queue,
      ...super.toJSON()
    };
  }
}
