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
  const [room, setRoom] = useState(null);

  useEffect(() => {
    if (!roomId) return;

    const fetchRoom = async () => {
      const url = `${serverUrl}/rooms/${roomId}`;
      const data = await (await fetch(url)).json();

      // TODO: Switch to an explaining page.
      if (!data.room) {
        history.push('/room-not-found');
        return;
      }

      setRoom(data.room);
    };
    fetchRoom();

    if (!user) return;

    const longPollRoom = () => {
      const url = `${serverUrl}/long-poll/${roomId}/${user.userId}`;
      fetch(url)
          .then(response => response.json())
          .then(data => {
            console.log(data);
            setRoom(data.room);
            longPollRoom();
          });
    };
    longPollRoom();

    const deleteUser = async () => {
      navigator.beacon = navigator.beacon || ((url) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, false);
        xhr.send(); 
      });

      const url = `${serverUrl}/rooms/${roomId}/users/delete/${user.userId}`;
      navigator.sendBeacon(url);
    };

    window.addEventListener('beforeunload', deleteUser);

    return () => {
      deleteUser();
      window.removeEventListener('beforeunload', deleteUser);
    }
  }, [roomId, user, history]);

  useEffect(() => {
    if (!room || !roomId || !user) return;
    setLoading(false);
  }, [room, roomId, user]);

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
          {Object.entries(room.users).map(([userId, user]) => 
            <div key={userId}>{user.name} {user.team} | {userId}</div>
          )}
        </div>
      }
    </React.Fragment>
  );  
}