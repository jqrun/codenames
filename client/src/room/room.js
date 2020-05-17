import Join from './join';
import React, {useEffect, useState} from 'react';
import styles from './room.module.scss';
import {serverUrl} from '../common/util';
import {useParams} from 'react-router-dom';

export default function Room() {
  const {roomId} = useParams();

  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
      const url = `${serverUrl}/rooms/${roomId}/users`;
      const response = await fetch(url);
      const data = await response.json();
      console.log(data);
      setUsers(data.users);
  };


  useEffect(() => {
    const deleteUser = () => {
      if (!user) return;

      const url = `${serverUrl}/rooms/${roomId}/users/delete/${user.userId}`;
      fetch(url, {method: 'POST'});
    };

    const temp = setInterval(fetchUsers, 5000);
    fetchUsers();
    window.addEventListener('unload', deleteUser);

    return () => {
      clearInterval(temp);
      window.removeEventListener('unload', deleteUser);
    };
  }, [user]);

  // useEffect

  return (
    <React.Fragment>
      {!user &&
        <Join roomId={roomId} setUser={setUser} />
      }

      {user &&
        <div style={styles.room}>
          Room: {roomId} <br/>
          User: {user.name} <br/><br/>
          All users: <br/>
          {users.map(user => 
            <div key={user.userId}>{user.name}</div>
          )}
        </div>
      }
    </React.Fragment>
  );  
}