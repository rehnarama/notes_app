export enum SignallingEvent {
  PING,
  PONG,
  NEW_PEER,
  DESCRIPTION,
  ICE_CANDIDATE,
  ASSIGNED_PEER_ID
}

export default abstract class SignallingMessage {
  event: SignallingEvent;
  args?: any[];

  constructor(event: SignallingEvent, args?: any[]) {
    this.event = event;
    this.args = args;
  }

  toJson() {
    return JSON.stringify([this.event, this.args]);
  }

  isPing(): this is Ping {
    return this.event === SignallingEvent.PING;
  }

  isPong(): this is Pong {
    return this.event === SignallingEvent.PONG;
  }

  isNewPeer(): this is NewPeer {
    return this.event === SignallingEvent.NEW_PEER;
  }

  isDescription(): this is Description {
    return this.event === SignallingEvent.DESCRIPTION;
  }

  isIceCandidate(): this is IceCandidate {
    return this.event === SignallingEvent.ICE_CANDIDATE;
  }

  isAssignedPeerId(): this is AssignedPeerId {
    return this.event === SignallingEvent.ASSIGNED_PEER_ID;
  }

  static fromJson(json: string) {
    const data = JSON.parse(json);

    const event = data[0];
    const args = data[1];

    switch (event as SignallingEvent) {
      case SignallingEvent.PING:
        return new Ping();
      case SignallingEvent.PONG:
        return new Pong();
      case SignallingEvent.NEW_PEER:
        return new NewPeer(args[0]);
      case SignallingEvent.DESCRIPTION:
        return new Description(args[0], args[1]);
      case SignallingEvent.ICE_CANDIDATE:
        return new IceCandidate(args[0], args[1]);
      case SignallingEvent.ASSIGNED_PEER_ID:
        return new AssignedPeerId(args[0]);
      default:
        throw new Error("Unknown SignallingEvent");
    }
  }
}

export class Ping extends SignallingMessage {
  constructor() {
    super(SignallingEvent.PING);
  }
}

export class Pong extends SignallingMessage {
  constructor() {
    super(SignallingEvent.PONG);
  }
}

export class NewPeer extends SignallingMessage {
  public peerId: number;
  constructor(peerId: number) {
    super(SignallingEvent.NEW_PEER, [peerId]);
    this.peerId = peerId;
  }
}

export class Description extends SignallingMessage {
  remoteDescription: RTCSessionDescriptionInit;
  peerId: number;
  constructor(remoteDescription: RTCSessionDescriptionInit, peerId: number) {
    super(SignallingEvent.DESCRIPTION, [remoteDescription, peerId]);
    this.remoteDescription = remoteDescription;
    this.peerId = peerId;
  }
}

export class IceCandidate extends SignallingMessage {
  iceCandidate: RTCIceCandidateInit | RTCIceCandidate;
  peerId: number;
  constructor(
    iceCandidate: RTCIceCandidateInit | RTCIceCandidate,
    peerId: number
  ) {
    super(SignallingEvent.ICE_CANDIDATE, [iceCandidate, peerId]);
    this.iceCandidate = iceCandidate;
    this.peerId = peerId;
  }
}

export class AssignedPeerId extends SignallingMessage {
  peerId: number;
  constructor(peerId: number) {
    super(SignallingEvent.ASSIGNED_PEER_ID, [peerId]);
    this.peerId = peerId;
  }
}
