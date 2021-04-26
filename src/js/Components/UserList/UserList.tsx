import * as React from "react";
import User from "src/js/Data/Users/User";

const UserListItem: React.FC<{ user: User }> = props => {
  return <li>{props.user.name}</li>;
};

const UserList: React.FC<{ users: User[] }> = props => {
  return (
    <ul>
      {props.users.map(user => (
        <UserListItem key={user.id} user={user} />
      ))}
    </ul>
  );
};

export default UserList;
