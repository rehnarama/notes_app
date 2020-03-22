import CausalBroadcast, { CausalMessage } from "./CausalBroadcast";
import INetwork from "./INetwork";
import VectorClock from "./VectorClock";
import Hook from "./Hook";

export default class TaggedCausalStableBroadcast extends CausalBroadcast {
  /**
   * Map from peer id to timestamp
   */
  private delivered = new Map<number, VectorClock>();
  private unstable: Array<{ clock: VectorClock; source: number }> = [];

  /**
   * Hooks that is called when a timestamp is considered to be causally stable
   */
  public tcsStable = new Hook<(timestamp: VectorClock) => void>();
  public tcsDeliver = new Hook<
    (message: any, timestamp: VectorClock) => void
  >();

  public constructor(network: INetwork, header = "TCSB") {
    super(network, header);

    this.tcDeliver.add(this.onTCDeliver);

    for (let i = 0; i < network.connections.length + 1; i++) {
      // +1 since there connection are one less than number of peers (since the
      // local peer is not represented there!)
      this.delivered.set(i, new VectorClock(network.connections.length + 1));
    }
  }

  /**
   * Overridden hook from CausalBroadcast
   */
  private onTCDeliver = (msg: CausalMessage) => {
    const clock = VectorClock.fromJson(msg.timestamp.clock);
    this.delivered.set(msg.timestamp.id, clock);

    this.tcsDeliver.call(msg.message, clock);

    this.unstable.push({ source: msg.timestamp.id, clock });
    this.checkStability();
  };

  public tcsBroadcast(message: any) {
    this.cBroadcast(message);
  }

  private checkStability() {
    for (let i = this.unstable.length - 1; i >= 0; i--) {
      // Start loop at end to avoid any side effects if a message has become
      // stable

      const msg = this.unstable[i];
      if (this.isStable(msg.clock, msg.source)) {
        this.tcsStable.call(msg.clock);
        this.unstable.splice(i, 1);
      }
    }
  }

  private isStable(ts: VectorClock, sourceId: number) {
    return ts.get(sourceId) <= this.lowerBound(sourceId);
  }

  /**
   * Gives the greatest lower bound on messages issued at j delivered at each
   * other node
   */
  private lowerBound(peerId: number) {
    let min = Number.MAX_SAFE_INTEGER;

    for (const clock of this.delivered.values()) {
      min = Math.min(clock.get(peerId), min);
    }

    return min;
  }

  public toJSON(): any {
    return {
      delivered: Array.from(this.delivered.entries()),
      unstable: this.unstable
    };
  }
}
