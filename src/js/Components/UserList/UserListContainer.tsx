import * as React from "react";
import User from "../../Data/Users/User";
import UserList from "./UserList";
import DataContext from "../../Data/DataContext";

const UserListContainer: React.FC = () => {
  const { userList } = React.useContext(DataContext);
  const [users, setUsers] = React.useState<User[]>([]);

  React.useEffect(() => {
    function onUsersUpdated() {
      setUsers(userList.users);
    }
    userList.onUsersUpdated.add(onUsersUpdated);

    return () => {
      userList.onUsersUpdated.remove(onUsersUpdated);
    };
  }, [userList]);

  return <UserList users={users} localName={userList.localName} />;
};

export default UserListContainer;
