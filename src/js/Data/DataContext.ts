import React from "react";
import { NullNetwork } from "network";
import Lines from "./Lines/Lines";
import UserList from "./Users/UserList";
import PointersData from "./Pointers/PointersData";

interface DataContext {
  lines: Lines;
  userList: UserList;
  pointers: PointersData;
}

const defaultContext: DataContext = {
  lines: new Lines(new NullNetwork()),
  userList: new UserList(new NullNetwork()),
  pointers: new PointersData(new NullNetwork())
};

const context = React.createContext<DataContext>(defaultContext);

const { Consumer, Provider } = context;
export { Provider, Consumer };

export default context;
