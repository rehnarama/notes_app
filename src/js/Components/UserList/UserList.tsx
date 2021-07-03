import * as React from "react";
import classes from "./UserList.module.css";
import { ConnectionState } from "network/";
import classNames from "classnames";
import User from "../../Data/Users/User";

const isLoading = (state: ConnectionState): boolean => {
  return state !== "connected";
};

const UserListItem: React.FC<{ user: User }> = props => {
  return (
    <div
      className={classNames({
        [classes.userListItem]: true,
        [classes.userListItemLoading]: isLoading(props.user.state)
      })}
      title={`${props.user.name} - ${props.user.state}`}
    >
      {props.user.name.substr(0, 1).toUpperCase()}
    </div>
  );
};

const UserList: React.FC<{ users: User[]; localName: string }> = props => {
  return (
    <>
      <UserListItem
        user={{ id: "", name: props.localName, state: "connected" }}
      />
      {props.users.map(user => (
        <UserListItem key={user.id} user={user} />
      ))}
    </>
  );
};

export default UserList;
