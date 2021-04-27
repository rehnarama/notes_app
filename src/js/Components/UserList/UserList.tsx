import * as React from "react";
import User from "src/js/Data/Users/User";
import classes from "./UserList.module.css"

const UserListItem: React.FC<{ user: User }> = props => {
  return (
    <div className={classes.userListItem} title={`${props.user.name} - ${props.user.state}`}>
      {props.user.name.substr(0, 1).toUpperCase()}
    </div>
  );
};

const UserList: React.FC<{ users: User[]; localName: string }> = props => {
  return (
    <>
      <UserListItem user={{ id: "", name: props.localName, state: "connected" }} />
      {props.users.map(user => (
        <UserListItem key={user.id} user={user} />
      ))}
    </>
  );
};

export default UserList;
