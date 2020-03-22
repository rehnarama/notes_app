import wrtc from "wrtc";
global.RTCPeerConnection = wrtc.RTCPeerConnection;
global.RTCIceCandidate = wrtc.RTCIceCandidate;
global.RTCSessionDescription = wrtc.RTCSessionDescription;

import { SignallingServer } from "signalling";
import Network from "./FullMeshNetwork";
import CausalBroadcast from "./CausalBroadcast";

export async function waitFor(ms: number) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), ms);
  });
}

describe("CausalBroadcast", () => {
  const PORT = 8084;
  const URL = `ws://localhost:${PORT}`;
  let server: SignallingServer;

  beforeEach(() => {
    server = new SignallingServer(PORT);
  });

  afterEach(async () => {
    await server.close();
  });

  test("Should be able to broacast to one other peer", async done => {
    const n1 = new Network(URL);
    const n2 = new Network(URL);

    while (n1.connections.length !== 1 || n2.connections.length !== 1) {
      await waitFor(5);
    }

    const cb1 = new CausalBroadcast(n1);
    const cb2 = new CausalBroadcast(n2);

    const msg = { key: "value" };
    cb1.cDeliver.add(async message => {
      expect(message).toStrictEqual(msg);

      n1.close();
      n2.close();

      done();
    });

    cb2.cBroadcast(msg);
  });

  test("Should be able to basic broadcast to many peers", async done => {
    const n1 = new Network(URL);
    const n2 = new Network(URL);
    const n3 = new Network(URL);

    while (
      n1.connections.length !== 2 ||
      n2.connections.length !== 2 ||
      n3.connections.length !== 2
    ) {
      await waitFor(5);
    }

    const cb1 = new CausalBroadcast(n1);
    const cb2 = new CausalBroadcast(n2);
    const cb3 = new CausalBroadcast(n3);

    const msg = { key: "value" };
    let hasReceived = false;
    function onDeliver(message: any) {
      expect(message).toStrictEqual(msg);

      if (hasReceived) {
        n1.close();
        n2.close();
        n3.close();
        done();
      } else {
        hasReceived = true;
      }
    }
    cb1.cDeliver.add(onDeliver);
    cb2.cDeliver.add(onDeliver);

    cb3.cBroadcast(msg);
  });
});
