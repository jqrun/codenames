import Join from './join';
import React, {useEffect, useState} from 'react';
import styles from './room.module.scss';
import {serverUrl} from '../common/util';
import {useParams} from 'react-router-dom';

export default function Room() {
  const {roomId} = useParams();

  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!roomId) return;

    const fetchUsers = async () => {
      const url = `${serverUrl}/rooms/${roomId}/users`;
      const response = await fetch(url);
      const data = await response.json();
      console.log(data.users);
      setUsers(data.users);
    };
    fetchUsers();

    const longPollUsers = () => {
      const url = `${serverUrl}/rooms/${roomId}/long-poll/users`;
      fetch(url)
          .then(response => response.json())
          .then(data => {
            console.log(data);
            longPollUsers();
          });
    };
    // longPollUsers();

    if (!user) return;

    const deleteUser = async () => {
      const url = `${serverUrl}/rooms/${roomId}/users/delete/${user.userId}`;
      await fetch(url, {method: 'POST'});
    };

    window.addEventListener('beforeunload', deleteUser);

    return () => {
      deleteUser();
      window.removeEventListener('beforeunload', deleteUser);
    }
  }, [roomId, user]);

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