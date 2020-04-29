import EagerTCSB from "./EagerTCSB";
import MockNetwork from "./util/MockNetwork";

describe("EagerTCSB", () => {
  describe("Basic broadcasting", () => {
    test("One message from one peer to another", () => {
      const n1 = new MockNetwork(0);
      const n2 = new MockNetwork(1);
      n1.connect(n2);

      const tcsb1 = new EagerTCSB(n1);
      const tcsb2 = new EagerTCSB(n2);

      const originalMessage = "Hi there, this is a message";
      let receivedMessage: undefined | string;
      tcsb1.tcsDeliver.add(msg => {
        receivedMessage = msg;
      });

      tcsb2.tcsBroadcast(originalMessage);
      n2.deliver();

      expect(receivedMessage).toEqual(originalMessage);
    });

    test("One message from one peer, to two others", () => {
      const n1 = new MockNetwork(0);
      const n2 = new MockNetwork(1);
      const n3 = new MockNetwork(2);
      n1.connect(n2);
      n1.connect(n3);
      n2.connect(n3);

      const tcsb1 = new EagerTCSB(n1);
      const tcsb2 = new EagerTCSB(n2);
      const tcsb3 = new EagerTCSB(n3);

      let timesReceived = 0;
      tcsb2.tcsDeliver.add(() => {
        timesReceived++;
      });
      tcsb3.tcsDeliver.add(() => {
        timesReceived++;
      });

      tcsb1.tcsBroadcast("a message");
      n1.deliver();

      expect(timesReceived).toBe(2);
    });
  });

  describe("Stability gossiping", () => {
    test("Stability should be determined on sender side", () => {
      const n1 = new MockNetwork(0);
      const n2 = new MockNetwork(1);
      n1.connect(n2);

      const tcsb1 = new EagerTCSB(n1);
      new EagerTCSB(n2);

      let isStable = false;
      tcsb1.tcsStable.add(() => {
        isStable = true;
      });

      tcsb1.tcsBroadcast("a message");
      n1.deliver();

      expect(isStable).toBe(false);

      // There now _should_ be an ACK message in the other network, ready to be
      // delivered
      n2.deliver();

      expect(isStable).toBe(true);
    });

    test("Stability should be determined on receiver side once gossiped", () => {
      const n1 = new MockNetwork(0);
      const n2 = new MockNetwork(1);
      n1.connect(n2);

      const tcsb1 = new EagerTCSB(n1);
      const tcsb2 = new EagerTCSB(n2);

      let isStable = false;
      tcsb2.tcsStable.add(() => {
        isStable = true;
      });

      tcsb1.tcsBroadcast("a message");
      n1.deliver();

      expect(isStable).toBe(false);

      n2.deliver();

      expect(isStable).toBe(false);

      n1.deliver();

      expect(isStable).toBe(true);
    });

    test("Stability should be determined on sender side in three-way network", () => {
      const n1 = new MockNetwork(0);
      const n2 = new MockNetwork(1);
      const n3 = new MockNetwork(2);
      n1.connect(n2);
      n1.connect(n3);
      n2.connect(n3);

      const tcsb1 = new EagerTCSB(n1);
      new EagerTCSB(n2);
      new EagerTCSB(n3);

      let isStable = false;
      tcsb1.tcsStable.add(() => {
        isStable = true;
      });

      tcsb1.tcsBroadcast("a message");
      n1.deliver();

      expect(isStable).toBe(false);

      n2.deliver();

      expect(isStable).toBe(false);

      n3.deliver();

      expect(isStable).toBe(true);
    });

    test("Stability should be determined on receiver side once gossiped in three-way network", () => {
      const n1 = new MockNetwork(0);
      const n2 = new MockNetwork(1);
      const n3 = new MockNetwork(2);
      n1.connect(n2);
      n1.connect(n3);
      n2.connect(n3);

      const tcsb1 = new EagerTCSB(n1);
      const tcsb2 = new EagerTCSB(n2);
      const tcsb3 = new EagerTCSB(n3);

      let isStable2 = false;
      let isStable3 = false;
      tcsb2.tcsStable.add(() => {
        isStable2 = true;
      });
      tcsb3.tcsStable.add(() => {
        isStable3 = true;
      });

      tcsb1.tcsBroadcast("a message");
      n1.deliver();

      expect(isStable2).toBe(false);
      expect(isStable3).toBe(false);

      n2.deliver();
      n3.deliver();

      expect(isStable2).toBe(false);
      expect(isStable3).toBe(false);

      n1.deliver();

      expect(isStable2).toBe(true);
      expect(isStable3).toBe(true);
    });
  });
});
