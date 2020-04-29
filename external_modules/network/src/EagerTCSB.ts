import CausalBroadcast, { CausalMessage } from "./CausalBroadcast";
import INetwork from "./INetwork";
import VectorClock from "./VectorClock";
import Hook from "./Hook";

const ACK_HEADER = "ETCSB_ACK";
interface EagerTCSBOpMessage {
  type: "op";
  message: any;
}
interface EagerTCSBStableMessage {
  type: "stable";
  clock: string;
}
type EagerTCSBMessage = EagerTCSBOpMessage | EagerTCSBStableMessage;

interface EagerTCSBAckMessage {
  originalClock: string;
  timestamp: string;
}

export default class EagerTCSB extends CausalBroadcast {
  /**
   * This map keeps tracks of how many ACKs a local message has received from
   * remote peers
   */
  private unstableAckCount = new Map<string, number>();

  private ackQueue: Array<{
    originalClock: VectorClock;
    timestamp: VectorClock;
  }> = [];

  /**
   * Hooks that is called when a timestamp is considered to be causally stable
   */
  public tcsStable = new Hook<(timestamp: VectorClock) => void>();
  public tcsDeliver = new Hook<
    (message: any, timestamp: VectorClock) => void
  >();

  public constructor(network: INetwork, header = "ETCSB") {
    super(network, header);

    this.tcDeliver.add(this.onTCDeliver);

    for (const connection of network.connections) {
      connection.onMessage.add(this.handleOnMessage);
    }
  }

  private handleOnMessage = (data: any) => {
    const payload = JSON.parse(data);
    if (Array.isArray(payload) && payload[0] === ACK_HEADER) {
      const message: EagerTCSBAckMessage = payload[1];
      this.ackQueue.push({
        originalClock: VectorClock.fromJson(message.originalClock),
        timestamp: VectorClock.fromJson(message.timestamp)
      });

      this.processAckQueue();
    }
  };

  private processAckQueue = () => {
    for (let i = this.ackQueue.length - 1; i >= 0; i--) {
      const ack = this.ackQueue[i];
      if (ack.timestamp.isLessOrEqual(this.clock)) {
        // We have to ensure causal delivery of this ACK message, with regards
        // to the "real" messages sent over the CB
        const key = ack.originalClock.toJson();
        const currentCount = this.unstableAckCount.get(key);
        if (currentCount !== undefined) {
          this.unstableAckCount.set(key, currentCount + 1);
          this.checkStability(ack.originalClock);
        }

        this.ackQueue.splice(i, 1);
      }
    }
  };

  private sendAck = (peerId: number, clock: VectorClock) => {
    const message: EagerTCSBAckMessage = {
      originalClock: clock.toJson(),
      timestamp: this.clock.toJson()
    };
    const payload = [ACK_HEADER, message];
    const data = JSON.stringify(payload);

    const c = this.network.connections.find(con => con.remoteId === peerId);
    if (c !== undefined) {
      c.send(data);
    }
  };

  private shareStablilityInfo = (clock: VectorClock) => {
    const message: EagerTCSBStableMessage = {
      type: "stable",
      clock: clock.toJson()
    };
    super.cBroadcast(message);
  };

  private checkStability = (clock: VectorClock) => {
    const key = clock.toJson();
    const count = this.unstableAckCount.get(key);
    if (count === this.network.connections.length) {
      this.unstableAckCount.delete(key);
      this.shareStablilityInfo(clock);
      this.markStable(clock);
    }
  };

  private markStable = (clock: VectorClock) => {
    this.tcsStable.call(clock);
  };

  public tcsBroadcast = (message: any) => {
    const opMessage: EagerTCSBOpMessage = {
      type: "op",
      message
    };
    super.cBroadcast(opMessage);
  };

  /**
   * Overridden hook from CausalBroadcast
   */
  private onTCDeliver = (causalMessage: CausalMessage) => {
    const clock = VectorClock.fromJson(causalMessage.timestamp.clock);

    const message = causalMessage.message as EagerTCSBMessage;
    if (message.type === "op") {
      // Deliver message to upper layer
      this.tcsDeliver.call(message.message, clock);

      if (causalMessage.timestamp.id === this.network.localId) {
        // This means we sent this message, let's keep track of how many ACKs it
        // has received in our map, right now, no one has ACK:ed, ergo the 0
        this.unstableAckCount.set(causalMessage.timestamp.clock, 0);
      } else {
        // This is someone elses operation! Let's ACK we have delivered it
        this.sendAck(causalMessage.timestamp.id, clock);
      }
    } else if (message.type === "stable") {
      this.markStable(VectorClock.fromJson(message.clock));
    }
  };

  public toJSON(): any {
    return {
      unstableAckCount: Array.from(this.unstableAckCount.entries()),
      ackQueue: this.ackQueue,
      ...super.toJSON()
    };
  }
}
