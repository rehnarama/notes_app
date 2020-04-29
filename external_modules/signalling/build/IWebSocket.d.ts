/// <reference types="node" />
export declare type Data = string | Buffer | ArrayBuffer | Buffer[];
export declare const ReadyStates: {
    CONNECTING: number;
    OPEN: number;
    CLOSING: number;
    CLOSED: number;
};
export interface ICloseEvent {
    code: number;
    reason: string;
    wasClean: boolean;
}
export interface IMessageEvent {
    data: Data;
    type: string;
}
export default interface IWebSocket {
    readyState: number;
    onopen: (event: any) => void;
    onclose: (event: ICloseEvent) => void;
    onerror: (event: any) => void;
    onmessage: (event: IMessageEvent) => void;
    close: (code?: number, reason?: string) => void;
    send: (data: Data) => void;
}
//# sourceMappingURL=IWebSocket.d.ts.map