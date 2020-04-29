import IConnection from "./IConnection";
import Hook from "./Hook";
export default interface INetwork {
    localId?: number;
    connections: IConnection[];
    onConnection: Hook<(connection: IConnection) => void>;
}
//# sourceMappingURL=INetwork.d.ts.map