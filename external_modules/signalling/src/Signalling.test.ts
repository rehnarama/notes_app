import WS from "ws";
import Signalling from "./Signalling";
import SignallingServer from "./SignallingServer";
import IWebSocket, { ReadyStates } from "./IWebSocket";
import { waitFor } from "./TestUtils";
import { Description, IceCandidate } from "./SignallingMessage";

describe("Signalling", () => {
  let server: SignallingServer;
  beforeEach(() => {
    server = new SignallingServer(8081);
  });
  afterEach(async () => {
    await server.close();
  });
  test("Test connection", async () => {
    const signalling = new Signalling();
    signalling.connect("ws://localhost:8081");

    while (signalling.readyState === ReadyStates.CONNECTING) {
      await waitFor(5);
    }

    expect(signalling.readyState).toBe(ReadyStates.OPEN);

    signalling.close();

    while (signalling.readyState === ReadyStates.CLOSING) {
      await waitFor(5);
    }

    expect(signalling.readyState).toBe(ReadyStates.CLOSED);
  });

  test("New Peer message should be delivered upon another connection", done => {
    const s1 = new Signalling();
    s1.onNewPeer = newPeer => {
      expect(newPeer).toBeDefined();
      expect(newPeer.peerId).toBeDefined();
      expect(typeof newPeer.peerId).toBe("number");
      s1.close();
    };
    s1.onDescription = () => {
      expect(true).toBe(false);
    };
    s1.onIceCandidate = () => {
      expect(true).toBe(false);
    };
    s1.onClose = () => {
      done();
    };
    const s2 = new Signalling();
    s2.onOpen = () => {
      s2.close();
    };

    s1.connect("ws://localhost:8081");
    s2.connect("ws://localhost:8081");
  });

  test("Descriptions should be delived upon transmission", done => {
    const s1 = new Signalling();
    const s1Desc = "s1Desc";
    const s2Desc = "s2Desc";
    s1.onNewPeer = newPeer => {
      s1.send(new Description(s1Desc, newPeer.peerId));
    };
    s1.onDescription = description => {
      expect(description.remoteDescription).toBe(s2Desc);
      s1.close();
    };
    s1.onClose = () => {
      done();
    };

    const s2 = new Signalling();
    s2.onDescription = description => {
      expect(description.remoteDescription).toBe(s1Desc);
      s2.send(new Description(s2Desc, description.peerId));
      s2.close();
    };
    s1.connect("ws://localhost:8081");
    s2.connect("ws://localhost:8081");
  });

  test("IceCandidates should be delived upon transmission", done => {
    const s1 = new Signalling();
    const s1Candidate = "s1Cand";
    const s2Candidate = "s2Cand";
    s1.onNewPeer = newPeer => {
      s1.send(new IceCandidate(s1Candidate, newPeer.peerId));
    };
    s1.onIceCandidate = candidate => {
      expect(candidate.iceCandidate).toBe(s2Candidate);
      s1.close();
    };
    s1.onClose = () => {
      done();
    };

    const s2 = new Signalling();
    s2.onIceCandidate = candidate => {
      expect(candidate.iceCandidate).toBe(s1Candidate);
      s2.send(new IceCandidate(s2Candidate, candidate.peerId));
      s2.close();
    };
    s1.connect("ws://localhost:8081");
    s2.connect("ws://localhost:8081");
  });
});
