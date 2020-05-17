import Join from './join';
import React, {useEffect, useRef, useState} from 'react';
import styles from './room.module.scss';
import {serverUrl} from '../common/util';
import {useParams} from 'react-router-dom';

export default function Room() {
  const {roomId} = useParams();

  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);

  const userIdRef = useRef();

  const fetchUsers = async () => {
      const url = `${serverUrl}/rooms/${roomId}/users`;
      const response = await fetch(url);
      const data = await response.json();
      console.log(data);
      setUsers(data.users);
  };

  useEffect(() => {
    const deleteUser = () => {
      const userId = userIdRef.current;
      if (!userId) return;

      const url = `${serverUrl}/rooms/${roomId}/users/delete/${userId}`;
      fetch(url, {method: 'POST'});
    };

    const temp = setInterval(fetchUsers, 5000);
    fetchUsers();

    window.addEventListener('beforeunload', deleteUser);

    return () => {
      clearInterval(temp);

      deleteUser();
      window.removeEventListener('beforeunload', deleteUser);
    }
  }, []);

  useEffect(() => {
    userIdRef.current = user && user.userId;
    fetchUsers();
  }, [user]);

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