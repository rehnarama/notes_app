import IConnection, { ConnectionState } from "./IConnection";
import Hook from "./Hook";

const DEFAULT_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

export default class Connection implements IConnection {
  private pc?: RTCPeerConnection;
  private config: RTCConfiguration;

  private channel?: RTCDataChannel;

  public onLocalIceCandidate = new Hook<
    (iceCandidate: RTCIceCandidate) => void
  >();

  public onConnectionStateChange = new Hook<
    (state: ConnectionState, sender: IConnection) => void
  >();
  public onChannelOpen = new Hook<() => void>();

  public onMessage = new Hook<(message: any, sender: IConnection) => void>();

  public remoteId?: number;

  public get connectionState() {
    if (this.pc) {
      return this.pc.iceConnectionState;
    } else {
      return "new";
    }
  }

  constructor(remoteId: number, config: RTCConfiguration = DEFAULT_CONFIG) {
    this.remoteId = remoteId;
    this.config = config;
  }

  private initialise() {
    this.pc = new RTCPeerConnection(this.config);

    this.pc.onicecandidate = this.handleOnIceCandidate;
    this.pc.ondatachannel = this.handleOnDataChannel;
    this.pc.oniceconnectionstatechange = this.handleOnConnectionStateChange;
    // this.pc.onconnectionstatechange = this.handleOnConnectionStateChange;
    console.log("event etc");
  }

  private handleOnConnectionStateChange = () => {
    if (this.pc !== undefined) {
      this.pc.iceConnectionState;
      this.onConnectionStateChange.call(this.pc.iceConnectionState, this);
    }
  };

  private handleOnIceCandidate = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate !== null) {
      this.onLocalIceCandidate.call(event.candidate);
    }
  };

  private handleOnDataChannel = (event: RTCDataChannelEvent) => {
    this.channel = event.channel;
    this.setupChannel();
  };

  private setupChannel() {
    if (this.channel) {
      this.channel.onmessage = this.handleOnChannelMessage;
      this.channel.onopen = this.handleOnChannelOpen;
    }
  }

  private handleOnChannelOpen = () => {
    this.onChannelOpen.call();
  };

  private handleOnChannelMessage = (event: MessageEvent) => {
    this.onMessage.call(event.data, this);
  };

  public setRemoteDescription = async (
    description: RTCSessionDescriptionInit
  ) => {
    if (this.pc !== undefined) {
      await this.pc.setRemoteDescription(
        new RTCSessionDescription(description)
      );
    } else {
      throw new Error("Peer connection is uninitialised");
    }
  };

  public createAnswer = async (
    description: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> => {
    this.initialise();
    this.setRemoteDescription(description);

    if (this.pc !== undefined) {
      const description = await this.pc.createAnswer();
      await this.pc.setLocalDescription(description);
      if (this.pc.localDescription !== null) {
        return this.pc.localDescription;
      } else {
        throw new Error("Could not generate answer from offer");
      }
    } else {
      throw new Error("Peer Connection in uninitialised");
    }
  };

  public createOffer = async (): Promise<RTCSessionDescriptionInit> => {
    this.initialise();

    if (this.pc !== undefined) {
      // Create a data channel for communication
      this.channel = this.pc.createDataChannel("channel");
      this.setupChannel();

      // Create an offer which will be sent to remote peer via signalling server
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      if (this.pc.localDescription !== null) {
        return this.pc.localDescription;
      } else {
        throw new Error("Could  not create offer");
      }
    } else {
      throw new Error("Peer Connection in uninitialised");
    }
  };

  public addRemoteIceCandidate = async (
    candidate: RTCIceCandidateInit | RTCIceCandidate
  ) => {
    if (this.pc !== undefined) {
      if (candidate instanceof RTCIceCandidate) {
        await this.pc.addIceCandidate(candidate);
      } else {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } else {
      throw new Error("Peer Connection in uninitialised");
    }
  };

  public send(message: string): void;
  public send(message: Blob): void;
  public send(message: ArrayBuffer): void;
  public send(message: ArrayBufferView): void;
  public send(message: string | Blob | ArrayBuffer | ArrayBufferView) {
    if (this.channel) {
      // The if-cases is needed due to typescript not accepting it else, even
      // though I think it should!
      if (typeof message === "string") {
        this.channel.send(message);
      } else if (message instanceof Blob) {
        this.channel.send(message);
      } else if (message instanceof ArrayBuffer) {
        this.channel.send(message);
      } else {
        this.channel.send(message);
      }
    } else {
      throw new Error("Channel hasn't been opened");
    }
  }

  public close() {
    if (this.pc) {
      this.pc.close();
    }
  }
}
