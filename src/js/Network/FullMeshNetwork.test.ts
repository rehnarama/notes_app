import wrtc from "wrtc";
global.RTCPeerConnection = wrtc.RTCPeerConnection;
global.RTCIceCandidate = wrtc.RTCIceCandidate;
global.RTCSessionDescription = wrtc.RTCSessionDescription;

import { SignallingServer } from "signalling";
import Network from "./FullMeshNetwork";

export async function waitFor(ms: number) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), ms);
  });
}

describe("Network", () => {
  const PORT = 8082;
  const URL = `ws://localhost:${PORT}`;
  let server: SignallingServer;

  beforeAll(() => {
    server = new SignallingServer(PORT);
  });

  afterAll(async () => {
    await server.close();
  });

  it("should use signalling to connect two peers", done => {
    const n1 = new Network(URL);

    let n1Connected = false;
    let n2Connected = false;

    function checkEnd() {
      if (n1Connected && n2Connected) {
        expect(n1.localId).toBeDefined();
        expect(n2.localId).toBeDefined();
        n1.close();
        n2.close();
        done();
      }
    }

    n1.onConnection.add(() => {
      n1Connected = true;
      expect(n1.connections.length).toBe(1);
      expect(n1.connections[0].remoteId).toBeDefined();
      checkEnd();
    });

    const n2 = new Network(URL);
    n2.onConnection.add(() => {
      n2Connected = true;
      expect(n2.connections.length).toBe(1);
      expect(n2.connections[0].remoteId).toBeDefined();
      checkEnd();
    });
  });

  it("should use signalling to connect three peers", async () => {
    const n1 = new Network(URL);
    const n2 = new Network(URL);
    const n3 = new Network(URL);

    while (
      n1.connections.length !== 2 &&
      n2.connections.length !== 2 &&
      n3.connections.length !== 2
    ) {
      await waitFor(5);
    }

    n1.close();
    n2.close();
    n3.close();

    // NOTE: test fails if timeout => three connections were never made
  });
});
