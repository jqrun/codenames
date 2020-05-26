import Board from './board';
import css from './room.module.scss'
import Join from './join';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import Teams from './teams';
import {decrypt, getFetchUrl, isDev} from '../common/util';
import {useHistory} from "react-router-dom";
import {useParams} from 'react-router-dom';

// Toggle for local development.
const PERSIST_USER = true;

export default function Room() {
  const {roomId} = useParams();
  const history = useHistory();

  const [userId, setUserId] = useState(initialUserId);
  const [room, setRoom] = useState(null);
  const [polling, setPolling] = useState(true);
  const [loading, setLoading] = useState(true);

  const lastUpdateRef = useRef();

  const parseAndSetRoom = useCallback((roomUpdate) => {
    if (roomUpdate.users[userId]) {
      roomUpdate.users[userId].current = true;
    }
    if (isDev) console.log(roomUpdate);
    lastUpdateRef.current = roomUpdate.timestamps.lastUpdate;
    setRoom({...roomUpdate});
  }, [userId]);

  function initialUserId() {
    if (!isDev || !PERSIST_USER) return null;
    return sessionStorage.getItem(roomId);
  };

  // Initial room fetch.
  useEffect(() => {
    (async () => {
      const url = getFetchUrl(roomId, '/rooms', {roomId});
      const data = decrypt((await (await fetch(url)).json()).data);

      // TODO: Switch to an explaining page.
      if (!data.room) {
        history.push('/room-not-found');
        return;
      }

      parseAndSetRoom(data.room);
    })();
  }, [roomId, history, parseAndSetRoom]);

  // Poll for room updates.
  useEffect(() => {
    if (!userId || !polling) return;

    const pollController = new AbortController();
    const signal = pollController.signal;
    let pollTimer;
    const pollRoom = async () => {
      const lastUpdate = lastUpdateRef.current;
      if (lastUpdate) {
        try {
          const url = getFetchUrl(roomId, '/subscribe/poll', {roomId, userId, lastUpdate});
          const data = decrypt((await (await fetch(url, {signal})).json()).data);
          if (data.updated) parseAndSetRoom(data.room);
        } catch (err) {
          if (err.name === 'AbortError') return;
          console.error(err);
        }
      }
      pollTimer = setTimeout(pollRoom, 500);
    };
    pollRoom();

    return () => {
      clearTimeout(pollTimer);
      pollController.abort();
    };
  }, [roomId, userId, polling, parseAndSetRoom]);

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

      const url = getFetchUrl(roomId, '/users/delete', {roomId, userId});
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
              <Board 
                roomId={roomId} userId={userId} game={room.game} user={room.users[userId]}
                setPolling={setPolling}
              />
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



// DEPRECATED: Causes too many issues with concurrent open requests in prod.
// Long poll for room updates.
// useEffect(() => {
//   if (!userId) return;

//   const pollController = new AbortController();
//   const signal = pollController.signal;

//   const longPollRoom = async () => {
//     const url = getFetchUrl(roomId, '/subscribe/long-poll', {roomId, userId});
//     const data = decrypt((await (await fetch(url)).json()).data);

//     parseAndSetRoom(data.room);
//     longPollRoom();
//   };
//   longPollRoom();

//   return () => {
//     pollController.abort();
//   };
// }, [roomId, userId, parseAndSetRoom]);