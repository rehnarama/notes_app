import {
  Signalling,
  NewPeerHandler,
  DescriptionHandler,
  IceCandidateHandler,
  Description,
  IceCandidate,
  AssignedPeerIdHandler
} from "signalling";

import Connection from "./Connection";
import INetwork from "./INetwork";
import IConnection from "./IConnection";
import Hook from "./Hook";

export default class FullMeshNetwork implements INetwork {
  private signalling: Signalling;
  private allPeers = new Map<number, Connection>();
  private connectedPeers = new Map<number, Connection>();

  public localId?: number;

  public get connections() {
    return Array.from(this.connectedPeers.values());
  }

  public onConnection = new Hook<(connection: IConnection) => void>();

  /**
   * Constructs a new network
   * @param signallingUrl The url of the signalling server, e.g.
   *        ws://localhost:8080
   */
  constructor(signallingUrl: string) {
    this.signalling = new Signalling(
      this.handleOnAssignedPeerId,
      this.handleOnNewPeer,
      this.handleOnDescription,
      this.handleOnIceCandidate
    );

    this.signalling.connect(signallingUrl);
  }

  private handleOnAssignedPeerId: AssignedPeerIdHandler = assignedPeerId => {
    this.localId = assignedPeerId.peerId;
  };

  private handleOnNewPeer: NewPeerHandler = async newPeer => {
    const connection = this.createNewConnection(newPeer.peerId);

    const offer = await connection.createOffer();
    this.signalling.send(new Description(offer, newPeer.peerId));
  };

  private createNewConnection(peerId: number): Connection {
    const connection = new Connection(peerId);
    this.allPeers.set(peerId, connection);

    connection.onLocalIceCandidate.add(iceCandidate => {
      this.signalling.send(new IceCandidate(iceCandidate, peerId));
    });

    connection.onChannelOpen.add(() => {
      if (!this.connectedPeers.has(peerId)) {
        this.connectedPeers.set(peerId, connection);
      }
      this.onConnection.call(connection);
    });

    return connection;
  }

  private handleOnDescription: DescriptionHandler = async description => {
    if (description.remoteDescription.type === "offer") {
      const connection = this.createNewConnection(description.peerId);

      const answer = await connection.createAnswer(
        description.remoteDescription
      );
      this.signalling.send(new Description(answer, description.peerId));
    } else {
      const connection = this.allPeers.get(description.peerId);
      if (!connection) {
        throw new Error(
          `Couldn't find connection with peer id ${description.peerId}`
        );
      }

      connection.setRemoteDescription(description.remoteDescription);
    }
  };

  private handleOnIceCandidate: IceCandidateHandler = iceCandidate => {
    const connection = this.allPeers.get(iceCandidate.peerId);
    if (!connection) {
      throw new Error(
        `Couldn't find connection with peer id ${iceCandidate.peerId}`
      );
    }

    connection.addRemoteIceCandidate(iceCandidate.iceCandidate);
  };

  /**
   * Closes all peer connections and connection to signaling server
   */
  public close() {
    this.signalling.close();

    for (const connection of this.allPeers.values()) {
      connection.close();
    }
    this.allPeers.clear();
    this.connectedPeers.clear();
  }

  public toJSON() {
    return {
      signalling: this.signalling,
      allPeers: Array.from(this.allPeers.entries()),
      connectedPeers: Array.from(this.connectedPeers.entries()),
      localId: this.localId
    };
  }
}
