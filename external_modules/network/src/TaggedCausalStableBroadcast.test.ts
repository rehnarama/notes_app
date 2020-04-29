import wrtc from "wrtc";
global.RTCPeerConnection = wrtc.RTCPeerConnection;
global.RTCIceCandidate = wrtc.RTCIceCandidate;
global.RTCSessionDescription = wrtc.RTCSessionDescription;

import { SignallingServer } from "signalling";
import Network from "./FullMeshNetwork";
import TaggedCausalStableBroadcast from "./TaggedCausalStableBroadcast";
import VectorClock from "./VectorClock";
import MockNetwork from "./util/MockNetwork";

export async function waitFor(ms: number) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), ms);
  });
}

describe("TaggedCausalStableBroadcast", () => {
  const PORT = 8085;
  const URL = `ws://localhost:${PORT}`;
  let server: SignallingServer;

  beforeEach(() => {
    server = new SignallingServer(PORT);
  });

  afterEach(async () => {
    await server.close();
  });

  describe("Basic broadcasting", () => {
    test("Should be able to broacast to one other peer", async done => {
      const n1 = new Network(URL);
      const n2 = new Network(URL);

      while (n1.connections.length !== 1 || n2.connections.length !== 1) {
        await waitFor(5);
      }

      const tcsb1 = new TaggedCausalStableBroadcast(n1);
      const tcsb2 = new TaggedCausalStableBroadcast(n2);

      const msg = { key: "value" };
      tcsb1.tcsDeliver.add(async (message, ts) => {
        expect(message).toStrictEqual(msg);
        expect(ts instanceof VectorClock).toBe(true);
        expect(ts.size).toBe(2);

        n1.close();
        n2.close();

        done();
      });

      tcsb2.tcsBroadcast(msg);
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

      const tcsb1 = new TaggedCausalStableBroadcast(n1);
      const tcsb2 = new TaggedCausalStableBroadcast(n2);
      const tcsb3 = new TaggedCausalStableBroadcast(n3);

      const msg = { key: "value" };
      let hasReceived = false;
      function onDeliver(message: any, ts: VectorClock) {
        expect(message).toStrictEqual(msg);
        expect(ts instanceof VectorClock).toBe(true);
        expect(ts.size).toBe(3);

        if (hasReceived) {
          n1.close();
          n2.close();
          n3.close();
          done();
        } else {
          hasReceived = true;
        }
      }
      tcsb1.tcsDeliver.add(onDeliver);
      tcsb2.tcsDeliver.add(onDeliver);

      tcsb3.tcsBroadcast(msg);
    });
  });

  describe("causal stability hook", () => {
    test("Simple stability test with one message", async done => {
      const n1 = new Network(URL);
      const n2 = new Network(URL);

      while (n1.connections.length !== 1 || n2.connections.length !== 1) {
        await waitFor(5);
      }

      const tcsb1 = new TaggedCausalStableBroadcast(n1);
      const tcsb2 = new TaggedCausalStableBroadcast(n2);

      tcsb1.tcsStable.add(ts => {
        expect(ts instanceof VectorClock).toBe(true);

        n1.close();
        n2.close();

        done();
      });

      const tcsb1Msg = "a random message";
      tcsb2.tcsDeliver.add(msg => {
        if (msg === tcsb1Msg) {
          tcsb2.tcsBroadcast(
            "a random message back, to send causality info to the other peer"
          );
        }
      });

      tcsb1.tcsBroadcast(tcsb1Msg);
    });

    test("Basic causal stability oracle", () => {
      const n1 = new MockNetwork(0);
      const n2 = new MockNetwork(1);
      const n3 = new MockNetwork(2);
      n1.connect(n2);
      n1.connect(n3);
      n2.connect(n3);

      const tcsb1 = new TaggedCausalStableBroadcast(n1);
      const tcsb2 = new TaggedCausalStableBroadcast(n2);
      const tcsb3 = new TaggedCausalStableBroadcast(n3);

      const stableTs: VectorClock[] = [];
      tcsb1.tcsStable.add(ts => {
        stableTs.push(ts);
      });

      tcsb1.tcsBroadcast("a message");
      n1.deliver();

      expect(stableTs.length).toBe(0);

      tcsb2.tcsBroadcast("a message");
      n2.deliver();

      expect(stableTs.length).toBe(0);

      tcsb3.tcsBroadcast("a message");
      n3.deliver();

      expect(stableTs.length).toBe(1);
    });

    test("Stability should be triggered at other peers only once causality info has been sent from all other peers", async done => {
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

      const tcsb1 = new TaggedCausalStableBroadcast(n1);
      const tcsb2 = new TaggedCausalStableBroadcast(n2);
      const tcsb3 = new TaggedCausalStableBroadcast(n3);

      let messagesReceived = 0;
      tcsb1.tcsDeliver.add(_message => {
        messagesReceived++;
        if (messagesReceived === 1) {
          // We have to send causal information to ourselves (well - an
          // optimisation CAN be made, since we can guarantee stability since
          // messages are instantly delivered to ourselves
          tcsb1.tcsBroadcast("yet another random message");
        }
      });
      tcsb1.tcsStable.add(_ts => {
        expect(messagesReceived).toBe(3);

        n1.close();
        n2.close();
        n3.close();
        done();
      });

      const tcsb2Msg = "random message";
      tcsb2.tcsBroadcast("random message");
      tcsb3.tcsDeliver.add(msg => {
        if (msg === tcsb2Msg) {
          tcsb3.tcsBroadcast("another random message");
        }
      });
    });
  });

  test("Stability determination with many peers and many messages", () => {
    const n1 = new MockNetwork(0);
    const n2 = new MockNetwork(1);
    const n3 = new MockNetwork(2);
    const n4 = new MockNetwork(3);
    n1.connect(n2);
    n1.connect(n3);
    n1.connect(n4);

    n2.connect(n3);
    n2.connect(n4);

    n3.connect(n4);

    const tcsb1 = new TaggedCausalStableBroadcast(n1);
    const tcsb2 = new TaggedCausalStableBroadcast(n2);
    const tcsb3 = new TaggedCausalStableBroadcast(n3);
    const tcsb4 = new TaggedCausalStableBroadcast(n4);

    let stableCount = 0;
    tcsb1.tcsStable.add(() => {
      stableCount++;
    });

    tcsb1.tcsBroadcast("message 1");
    tcsb1.tcsBroadcast("message 2");
    tcsb1.tcsBroadcast("message 3");
    tcsb1.tcsBroadcast("message 4");

    expect(stableCount).toBe(0);
    n1.deliver();
    expect(stableCount).toBe(0);

    tcsb2.tcsBroadcast("a response");
    n2.deliver();
    expect(stableCount).toBe(0);
    tcsb3.tcsBroadcast("a response");
    n3.deliver();
    expect(stableCount).toBe(0);
    tcsb4.tcsBroadcast("a response");
    n4.deliver();
    expect(stableCount).toBe(4);

  });

  test("Stability determination many concurrent messages", () => {
    const n1 = new MockNetwork(0);
    const n2 = new MockNetwork(1);
    const n3 = new MockNetwork(2);
    n1.connect(n2);
    n1.connect(n3);

    n2.connect(n3);


    const tcsb1 = new TaggedCausalStableBroadcast(n1);
    const tcsb2 = new TaggedCausalStableBroadcast(n2);
    const tcsb3 = new TaggedCausalStableBroadcast(n3);

    let ts100stable = false;
    let ts200stable = false;
    let ts010stable = false;
    let ts020stable = false;
    tcsb1.tcsStable.add((ts) => {
      if (new VectorClock([1, 0, 0]).isEqual(ts)) {
        ts100stable = true;
      } else if (new VectorClock([2, 0, 0]).isEqual(ts)) {
        ts200stable = true;
      } else if (new VectorClock([0, 1, 0]).isEqual(ts)) {
        ts010stable = true;
      } else if (new VectorClock([0, 2, 0]).isEqual(ts)) {
        ts020stable = true;
      }
    });

    // Send message to put matrix clock in state
    // [>1, 0, >1]
    // [>1, 0, >1]
    // [ 0, 0,  0]
    tcsb1.tcsBroadcast("message 1");
    tcsb1.tcsBroadcast("message 2");

    tcsb2.tcsBroadcast("message 3");
    tcsb2.tcsBroadcast("message 4");
    n1.deliver();
    n2.deliver();

    tcsb1.tcsBroadcast("message 5");
    tcsb2.tcsBroadcast("message 6");
    n1.deliver();
    n2.deliver();

    expect(ts100stable).toBe(false);
    expect(ts200stable).toBe(false);
    expect(ts010stable).toBe(false);
    expect(ts020stable).toBe(false);

    tcsb3.tcsBroadcast("a response");
    n3.deliver();

    expect(ts100stable).toBe(true);
    expect(ts200stable).toBe(true);
    expect(ts010stable).toBe(true);
    expect(ts020stable).toBe(true);

  });
});
