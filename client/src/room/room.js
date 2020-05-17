import Join from './join';
import React, {useEffect, useState} from 'react';
import styles from './room.module.scss';
import {serverUrl} from '../common/util';
import {useParams} from 'react-router-dom';

export default function Room() {
  const {roomId} = useParams();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!roomId || !user) return;

    const fetchUsers = async () => {
      const url = `${serverUrl}/rooms/${roomId}/users`;
      const response = await fetch(url);
      const data = await response.json();
      setUsers(data.users);
    };
    fetchUsers();

    const longPollUsers = () => {
      const url = `${serverUrl}/long-poll/${roomId}/${user.userId}/users`;
      fetch(url)
          .then(response => response.json())
          .then(data => {
            setUsers(data.users);
            longPollUsers();
          });
    };
    longPollUsers();

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

  useEffect(() => {
    if (!roomId || !user || !users.length) return;
    setLoading(false);
  }, [roomId, user, users]);

  return (
    <React.Fragment>
      {!user &&
        <Join roomId={roomId} setUser={setUser} />
      }

      {!loading &&
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