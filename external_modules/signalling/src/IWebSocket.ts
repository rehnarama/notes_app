export type Data = string | Buffer | ArrayBuffer | Buffer[];

export const ReadyStates = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
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
