import Board from './board';
import css from './room.module.scss'
import Join from './join';
import React, {useCallback, useEffect, useState} from 'react';
import Teams from './teams';
import {isDev, serverUrl} from '../common/util';
import {useHistory} from "react-router-dom";
import {useParams} from 'react-router-dom';

// Toggle for ease of local development.
const PERSIST_USER = true;

export default function Room() {
  const {roomId} = useParams();
  const history = useHistory();

  function initialUserId() {
    if (!isDev || !PERSIST_USER) return null;
    return sessionStorage.getItem(roomId);
  };

  const [userId, setUserId] = useState(initialUserId);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const parseAndSetRoom = useCallback((room) => {
    if (room.users[userId]) {
      room.users[userId].current = true;
    }
    setRoom(room);
  }, []);

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

      parseAndSetRoom(data.room);
    })();
  }, [roomId, history, parseAndSetRoom]);

  // Subscribe to room updates.
  useEffect(() => {
    if (!userId) return;

    const url = `${serverUrl}/subscribe/${roomId}/${userId}`;
    const eventSource = new EventSource(url, {withCredentials: true});
    eventSource.onmessage = (event) => {
      const room = JSON.parse(event.data);
      parseAndSetRoom(room);
    };

    return () => {
      eventSource.close();
    };
  }, [roomId, userId, parseAndSetRoom]);

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
      {!userId && <Join roomId={roomId} setUserId={setUserId} />}

      {!loading && <div className={css.room}>
        <div className={css.inner}>
          <div className={css.left}>
            <div className={css.board}>
              <Board roomId={roomId} userId={userId} board={room.game.board} />
            </div>
          </div>

          <div className={css.right}>
            <div className={css.teams}>
              <Teams roomId={roomId} userId={userId} users={room.users} />
            </div>

            <div className={css.chat}>
            </div>

            <div className={css.controls}>
            </div>
          </div>
        </div>
      </div>}
    </React.Fragment>
  );  
}