import * as React from "react";
import User from "src/js/Data/Users/User";

const UserListItem: React.FC<{ user: User }> = props => {
  return (
    <li>
      {props.user.name} - {props.user.state}
    </li>
  );
};

const UserList: React.FC<{ users: User[]; localName: string }> = props => {
  return (
    <>
      <p>You: {props.localName}</p>
      <ul>
        {props.users.map(user => (
          <UserListItem key={user.id} user={user} />
        ))}
      </ul>
    </>
  );
};

export default UserList;
