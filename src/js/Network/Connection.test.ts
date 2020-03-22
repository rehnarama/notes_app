import wrtc from "wrtc";
global.RTCPeerConnection = wrtc.RTCPeerConnection;
global.RTCIceCandidate = wrtc.RTCIceCandidate;
global.RTCSessionDescription = wrtc.RTCSessionDescription;

import Connection from "./Connection";

async function setUpPeers(): Promise<[Connection, Connection, Function]> {
  const c1 = new Connection(1);
  const c2 = new Connection(2);

  c1.onLocalIceCandidate.add(async cand => {
    if (c2.connectionState === "connecting" || c2.connectionState === "new") {
      c2.addRemoteIceCandidate(JSON.parse(JSON.stringify(cand)));
    }
  });
  c2.onLocalIceCandidate.add(async cand => {
    if (c1.connectionState === "connecting" || c1.connectionState === "new") {
      c1.addRemoteIceCandidate(JSON.parse(JSON.stringify(cand)));
    }
  });

  async function startConnection() {
    const offer = await c1.createOffer();
    const answer = await c2.createAnswer(offer);
    await c1.setRemoteDescription(answer);
  }

  return [c1, c2, startConnection];
}

describe("Connection", () => {
  test("Connection should be able to connect to each other", async done => {
    const [c1, c2, startConnection] = await setUpPeers();

    c1.onConnectionStateChange.add(state => {
      if (state === "connected") {
        c1.close();
        c2.close();
      }
      if (state === "closed") {
        done();
      }
    });

    await startConnection();
  });

  test("Connection should be able to send message to each other", async done => {
    const [c1, c2, startConnection] = await setUpPeers();

    const c1Message = "This is from c1";
    const c2Message = "and this is from c2";
    c1.onMessage.add(message => {
      expect(message).toBe(c2Message);
      c1.send(c1Message);
    });
    c2.onMessage.add(message => {
      expect(message).toBe(c1Message);
      c2.close();
      c1.close();
      done();
    });
    c2.onChannelOpen.add(() => {
      c2.send(c2Message);
    });

    await startConnection();
  });
});
