import CausalBroadcast, { CausalMessage } from "./CausalBroadcast";
import VectorClock from "./VectorClock";
import INetwork from "./INetwork";
import Hook from "./Hook";

export default class NonStabilisingTCSB extends CausalBroadcast {
  public tcsStable = new Hook<(timestamp: VectorClock) => void>();
  public tcsDeliver = new Hook<
    (message: any, timestamp: VectorClock) => void
  >();

  public constructor(network: INetwork, header = "NTCSB") {
    super(network, header);

    this.tcDeliver.add(this.onTCDeliver);
  }

  private onTCDeliver = (msg: CausalMessage) => {
    const clock = VectorClock.fromJson(msg.timestamp.clock);
    this.tcsDeliver.call(msg.message, clock);
  };

  public tcsBroadcast(message: any) {
    this.cBroadcast(message);
  }

  public toJSON() {
    return {
      ...super.toJSON()
    };
  }
}
