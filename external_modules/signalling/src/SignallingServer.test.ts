import WS from "ws";
import SignallingServer from "./SignallingServer";
import SignallingMessage, {
  SignallingEvent,
  Description,
  Ping,
  IceCandidate
} from "./SignallingMessage";
import { waitFor } from "./TestUtils";

const PORT = 8080;

describe("Signalling", () => {
  let server: SignallingServer;
  beforeEach(() => {
    server = new SignallingServer(PORT);
  });
  afterEach(async () => {
    await server.close();
  });

  test("A ping event should be met with a pong event", done => {
    const ws = new WS(`ws://localhost:${PORT}`);

    const message = new Ping();
    ws.onopen = () => {
      ws.send(message.toJson());
    };
    ws.onmessage = ({ data }) => {
      if (typeof data === "string") {
        const response = SignallingMessage.fromJson(data);
        expect(response.event === SignallingEvent.PONG);
        ws.close();
      } else {
        expect(false).toBeTruthy();
      }
    };
    ws.onclose = () => {
      done();
    };
  });

  test("Connection and disconnection should increase/decrease client count", done => {
    expect(server.numberOfPeers).toBe(0);
    const ws = new WS(`ws://localhost:${PORT}`);
    ws.onopen = () => {
      expect(server.numberOfPeers).toBe(1);
      ws.close();
    };
    ws.onclose = async () => {
      await waitFor(10); // let server process close request a while
      expect(server.numberOfPeers).toBe(0);
      done();
    };
  });

  describe("event NEW_PEER", () => {
    test("New peer event should be sent in case of two connection", done => {
      const ws1 = new WS(`ws://localhost:${PORT}`);

      ws1.onmessage = ({ data }) => {
        if (typeof data === "string") {
          const response = SignallingMessage.fromJson(data);
          expect(response.event === SignallingEvent.NEW_PEER);
          expect(response.args).toHaveLength(1);
          expect(response.args?.[0]).toBeDefined();
          expect(typeof response.args?.[0]).toBe("number");
          ws1.close();
        }
      };
      ws1.onclose = () => {
        done();
      };

      const ws2 = new WS(`ws://localhost:${PORT}`);
      ws2.onopen = () => ws2.close();
    });

    test("New peer event should be sent in case of three connections, with each peer id differing from each other", done => {
      let ws1FirstId: number | null = null;
      let ws1SecondId: number | null = null;
      let ws2FirstId: number | null = null;

      function completeTest() {
        if (
          ws1FirstId !== null &&
          ws1SecondId !== null &&
          ws2FirstId !== null
        ) {
          expect(ws1SecondId).not.toBe(ws1FirstId);
          expect(ws1SecondId).toBe(ws2FirstId);
          done();
        }
      }

      function startFirstSocket() {
        const ws1 = new WS(`ws://localhost:${PORT}`);
        ws1.onopen = startSecondSocket;
        ws1.onmessage = ({ data }) => {
          if (typeof data === "string") {
            const response = SignallingMessage.fromJson(data);
            if (response.isNewPeer()) {
              if (ws1FirstId === null) {
                ws1FirstId = response.peerId;
              } else if (ws1SecondId === null) {
                ws1SecondId = response.peerId;
                ws1.close();
              }
            }
          }
        };
        ws1.onclose = completeTest;
      }
      function startSecondSocket() {
        const ws2 = new WS(`ws://localhost:${PORT}`);
        ws2.onopen = startThirdSocket;
        ws2.onmessage = ({ data }) => {
          if (typeof data === "string") {
            const response = SignallingMessage.fromJson(data);
            if (response.isNewPeer()) {
              ws2FirstId = response.peerId;
              ws2.close();
            }
          }
        };
        ws2.onclose = completeTest;
      }
      function startThirdSocket() {
        const ws3 = new WS(`ws://localhost:${PORT}`);
        ws3.onopen = () => ws3.close();
      }

      startFirstSocket();
    });
  });

  describe("event DESCRIPTION", () => {
    test("DESCRIPTION events should be delivered to given client", done => {
      const ORIGINAL_DESC: RTCSessionDescriptionInit = {
        type: "offer",
        sdp: "orignal description"
      };

      let otherPeerId: number | null = null;
      const ws1 = new WS(`ws://localhost:${PORT}`);
      ws1.onopen = () => {
        const ws2 = new WS(`ws://localhost:${PORT}`);
        ws2.onmessage = ({ data }) => {
          if (typeof data === "string") {
            const msg = SignallingMessage.fromJson(data);
            if (msg.isDescription()) {
              expect(msg.remoteDescription).toEqual(ORIGINAL_DESC);
              expect(msg.peerId).not.toEqual(otherPeerId);
              ws2.close();
            }
          }
        };
        ws2.onclose = () => {
          done();
        };
      };

      ws1.onmessage = ({ data }) => {
        if (typeof data === "string") {
          const msg = SignallingMessage.fromJson(data);
          if (msg.isNewPeer()) {
            otherPeerId = msg.peerId;
            ws1.send(new Description(ORIGINAL_DESC, msg.peerId).toJson());
            ws1.close();
          }
          expect(msg.isDescription()).not.toBe(true); // We should never receive this
        }
      };
    });
  });

  describe("event ICE_CANDIDATE", () => {
    test("ICE_CANDIDATE events should be delivered to given client", done => {
      const ORIGINAL_CANDIDATE: RTCIceCandidateInit = {
        candidate: "some candidate"
      };

      let otherPeerId: number | null = null;
      const ws1 = new WS(`ws://localhost:${PORT}`);
      ws1.onopen = () => {
        const ws2 = new WS(`ws://localhost:${PORT}`);
        ws2.onmessage = ({ data }) => {
          if (typeof data === "string") {
            const msg = SignallingMessage.fromJson(data);
            if (msg.isIceCandidate()) {
              expect(msg.iceCandidate).toEqual(ORIGINAL_CANDIDATE);
              expect(msg.peerId).not.toEqual(otherPeerId);
              ws2.close();
            }
          }
        };
        ws2.onclose = () => {
          done();
        };
      };

      ws1.onmessage = ({ data }) => {
        if (typeof data === "string") {
          const msg = SignallingMessage.fromJson(data);
          if (msg.isNewPeer()) {
            otherPeerId = msg.peerId;
            ws1.send(new IceCandidate(ORIGINAL_CANDIDATE, msg.peerId).toJson());
            ws1.close();
          }
          expect(msg.isIceCandidate()).not.toBe(true); // We should never receive this
        }
      };
    });
  });
});
