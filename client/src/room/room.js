import Join from './join';
import React, {useEffect, useState} from 'react';
import styles from './room.module.scss';
import {isDev, serverUrl} from '../common/util';
import {useHistory} from "react-router-dom";
import {useParams} from 'react-router-dom';

const PERSIST_USER = false;

export default function Room() {
  const {roomId} = useParams();
  const history = useHistory();

  const sessionUserId = sessionStorage.getItem(roomId);

  const [userId, setUserId] = useState((isDev && PERSIST_USER) ? sessionUserId: null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initial room fetch.
  useEffect(() => {
    (async () => {
      const url = `${serverUrl}/rooms/${roomId}`;
      const data = await (await fetch(url)).json();

      // TODO: Switch to an explaining page.
      if (!data.room) {
        history.push('/room-not-found');
        return;
      }

      setRoom(data.room);
    })();
  }, [roomId, history]);

  // Subscribe to room updates.
  useEffect(() => {
    if (!userId) return;

    const url = `${serverUrl}/subscribe/${roomId}/${userId}`;
    const eventSource = new EventSource(url, {withCredentials: true});
    eventSource.onmessage = (event) => {
      const room = JSON.parse(event.data);
      console.log(room);
      setRoom(room);
    };

    return () => {
      eventSource.close();
    };
  }, [roomId, userId]);

  // Delete user when leaving the page.
  useEffect(() => {
    if (!userId) return;

    function deleteUser() {
      if (isDev && PERSIST_USER) return;

      navigator.beacon = navigator.beacon || ((url) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, false);
        xhr.send(); 
      });

      const url = `${serverUrl}/rooms/${roomId}/users/delete/${userId}`;
      navigator.sendBeacon(url);
    };

    window.addEventListener('beforeunload', deleteUser);
    return () => {
      window.removeEventListener('beforeunload', deleteUser);
      deleteUser();
    }
  }, [roomId, userId]);

  // Set loading state.
  useEffect(() => {
    if (!room || !roomId || !userId) return;
    setLoading(false);
  }, [room, roomId, userId]);

  if (!room) return (<div></div>);
  return (
    <React.Fragment>
      {!userId &&
        <Join roomId={roomId} setUserId={setUserId} />
      }

      {!loading &&
        <React.Fragment>
        <div style={styles.room}>
          <div style={styles.board}>
            Board
          </div>

          <div style={styles.controls}>
            Controls
          </div>

          <div style={styles.teams}>
            Teams
          </div>

          <div style={styles.chat}>
            Chat
          </div>
        </div>

        <div style={{position: "fixed", bottom: "1vw", left:"1vw", opacity: "0.4"}}>
          Room: {roomId} <br/>
          User: {userId} <br/><br/>
          All users: <br/>
          {Object.entries(room.users).map(([userId, user]) => 
            <div key={userId}>{user.name} {user.team} | {userId}</div>
          )}
        </div>
        </React.Fragment>
      }
    </React.Fragment>
  );  
}