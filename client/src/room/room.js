import Join from './join';
import React, {useEffect, useState} from 'react';
import styles from './room.module.scss';
import {serverUrl} from '../common/util';
import {useHistory} from "react-router-dom";
import {useParams} from 'react-router-dom';

export default function Room() {
  const {roomId} = useParams();
  const history = useHistory();

  const [userId, setUserId] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;

    async function fetchRoom() {
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

    if (!userId) return;

    function longPollRoom() {
      const url = `${serverUrl}/long-poll/${roomId}/${userId}`;
      fetch(url)
          .then(response => response.json())
          .then(data => {
            console.log(data);
            setRoom(data.room);
            longPollRoom();
          });
    };
    longPollRoom();

    function deleteUser() {
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
      deleteUser();
      window.removeEventListener('beforeunload', deleteUser);
    }
  }, [roomId, userId, history]);

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