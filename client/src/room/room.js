import Board from './board';
import css from './room.module.scss'
import Join from './join';
import React, {useCallback, useEffect, useState} from 'react';
import Teams from './teams';
import {decrypt, getServerUrl, isDev} from '../common/util';
import {useHistory} from "react-router-dom";
import {useParams} from 'react-router-dom';

// Toggle for local development.
const PERSIST_USER = false;

export default function Room() {
  const {roomId} = useParams();
  const history = useHistory();

  const [userId, setUserId] = useState(initialUserId);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const parseAndSetRoom = useCallback((room) => {
    if (room.users[userId]) {
      room.users[userId].current = true;
    }
    if (isDev) console.log(room);
    setRoom({...room});
  }, [userId]);

  function initialUserId() {
    if (!isDev || !PERSIST_USER) return null;
    return sessionStorage.getItem(roomId);
  };

  // Initial room fetch.
  useEffect(() => {
    (async () => {
      const url = `${getServerUrl(roomId)}/rooms/${roomId}`;
      const data = decrypt((await (await fetch(url)).json()).data);

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

    const pollController = new AbortController();
    const signal = pollController.signal;

    const longPollRoom = async () => {
      const url = `${getServerUrl(roomId)}/subscribe/long-poll/${roomId}/${userId}`;
      const {room} = decrypt((await (await fetch(url)).json()).data);

      parseAndSetRoom(room);
      longPollRoom();
    };
    longPollRoom();

    return () => {
      pollController.abort();
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

      const url = `${getServerUrl(roomId)}/rooms/${roomId}/users/delete/${userId}`;
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