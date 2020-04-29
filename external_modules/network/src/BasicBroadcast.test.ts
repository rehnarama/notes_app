import wrtc from "wrtc";
global.RTCPeerConnection = wrtc.RTCPeerConnection;
global.RTCIceCandidate = wrtc.RTCIceCandidate;
global.RTCSessionDescription = wrtc.RTCSessionDescription;

import { SignallingServer } from "signalling";
import Network from "./FullMeshNetwork";
import BasicBroadcast from "./BasicBroadcast";
import MockNetwork from "./util/MockNetwork";

export async function waitFor(ms: number) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), ms);
  });
}

describe("BasicBroadcast", () => {
  const PORT = 8083;
  const URL = `ws://localhost:${PORT}`;
  let server: SignallingServer;

  beforeAll(() => {
    server = new SignallingServer(PORT);
  });

  afterAll(async () => {
    await server.close();
  });

  test("Should be able to broacast to one other peer", async done => {
    const n1 = new Network(URL);
    const n2 = new Network(URL);

    while (n1.connections.length !== 1 || n2.connections.length !== 1) {
      await waitFor(5);
    }

    const bb1 = new BasicBroadcast(n1);
    const bb2 = new BasicBroadcast(n2);

    const msg = { key: "value" };
    bb1.bDeliver.add(message => {
      expect(message).toStrictEqual(msg);

      n1.close();
      n2.close();

      done();
    });

    bb2.bBroadcast(msg);
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

    const bb1 = new BasicBroadcast(n1);
    const bb2 = new BasicBroadcast(n2);
    const bb3 = new BasicBroadcast(n3);

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
    bb1.bDeliver.add(onDeliver);
    bb2.bDeliver.add(onDeliver);

    bb3.bBroadcast(msg);
  });

  test("Offline mode should stop messages to be delivered", () => {
    const n1 = new MockNetwork(0);
    const n2 = new MockNetwork(1);
    n1.connect(n2);

    const bb1 = new BasicBroadcast(n1);
    const bb2 = new BasicBroadcast(n2);

    bb1.setOffline(true);

    let nReceivedMessages = 0;
    bb2.bDeliver.add(() => {
      nReceivedMessages++;
    });

    bb1.bBroadcast("a message");
    n1.deliver();
    bb1.bBroadcast("another message");
    n1.deliver();

    expect(nReceivedMessages).toBe(0);

    bb1.setOffline(false);
    n1.deliver();

    expect(nReceivedMessages).toBe(2);
  });

  test("Offline mode should stop messages from being received", () => {
    const n1 = new MockNetwork(0);
    const n2 = new MockNetwork(1);
    n1.connect(n2);

    const bb1 = new BasicBroadcast(n1);
    const bb2 = new BasicBroadcast(n2);

    bb1.setOffline(true);

    let nReceivedMessages = 0;
    bb1.bDeliver.add(() => {
      nReceivedMessages++;
    });

    bb2.bBroadcast("a message");
    n2.deliver();
    bb2.bBroadcast("another message");
    n2.deliver();

    expect(nReceivedMessages).toBe(0);

    bb1.setOffline(false);

    expect(nReceivedMessages).toBe(2);
  });

  test("Offline mode should allows messages to be received to itself", () => {
    const n1 = new MockNetwork(0);
    const n2 = new MockNetwork(1);
    n1.connect(n2);

    const bb1 = new BasicBroadcast(n1);

    bb1.setOffline(true);

    let nReceivedMessages = 0;
    bb1.bDeliver.add((msg) => {
      nReceivedMessages++;
    });

    bb1.bBroadcast("a message");
    bb1.bBroadcast("another message");

    expect(nReceivedMessages).toBe(2);

    bb1.setOffline(false);
    
    expect(nReceivedMessages).toBe(2);
  });
});
