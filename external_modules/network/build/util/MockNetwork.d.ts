import INetwork from "../INetwork";
import IConnection, { ConnectionState } from "../IConnection";
import Hook from "../Hook";
export declare class MockConnection implements IConnection {
    remoteId?: number;
    connectionState: ConnectionState;
    onMessage: Hook<(message: any, sender: IConnection) => void>;
    private peer?;
    constructor(remoteId: number);
    private buffer;
    send(message: string): void;
    send(message: Blob): void;
    send(message: ArrayBuffer): void;
    send(message: ArrayBufferView): void;
    close(): void;
    deliver(): void;
    static createConnections(id1: number, id2: number): MockConnection[];
}
export default class MockNetwork implements INetwork {
    localId: number;
    constructor(localId: number);
    connect(other: MockNetwork): void;
    deliver(peers?: number[]): void;
    connections: MockConnection[];
    onConnection: Hook<(connection: IConnection) => void>;
}
//# sourceMappingURL=MockNetwork.d.ts.map