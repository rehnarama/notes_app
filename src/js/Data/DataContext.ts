import React from "react";
import { NullNetwork } from "network";
import Lines from "./Lines/Lines";
import UserList from "./Users/UserList";

interface DataContext {
  lines: Lines;
  userList: UserList;
}

const defaultContext: DataContext = {
  lines: new Lines(new NullNetwork()),
  userList: new UserList(new NullNetwork())
};

const context = React.createContext<DataContext>(defaultContext);

const { Consumer, Provider } = context;
export { Provider, Consumer };

export default context;
