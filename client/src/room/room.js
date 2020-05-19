import Join from './join';
import React, {useEffect, useState} from 'react';
import styles from './room.module.scss';
import {serverUrl} from '../common/util';
import {useHistory} from "react-router-dom";
import {useParams} from 'react-router-dom';

export default function Room() {
  const {roomId} = useParams();
  const history = useHistory();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [room, setRoom] = useState(null);

  useEffect(() => {
    if (!roomId) return;

    const fetchRoom = async () => {
      const url = `${serverUrl}/rooms/${roomId}`;
      const data = await (await fetch(url)).json();

      // TODO: Switch to an explaining page.
      if (!data.room) history.push('/room-not-found');

      setRoom(data.room);
    };
    fetchRoom();

    if (!user) return;

    const longPollRoom = () => {
      const url = `${serverUrl}/long-poll/${roomId}/${user.userId}`;
      fetch(url)
          .then(response => response.json())
          .then(data => {
            setUsers(data.room.users);
            longPollRoom();
          });
    };
    longPollRoom();

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

  if (!room) return (<div></div>);

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
            <div key={user.userId}>{user.name} {user.team}</div>
          )}
        </div>
      }
    </React.Fragment>
  );  
}