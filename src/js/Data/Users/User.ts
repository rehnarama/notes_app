import { ConnectionState } from "network";

export default interface User {
  id: string;
  name: string;
  state: ConnectionState;
}
