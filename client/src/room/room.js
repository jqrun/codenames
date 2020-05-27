import db from '../common/database';
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
  const [loading, setLoading] = useState(true);

  const parseAndSetRoom = useCallback((roomUpdate) => {
    if (roomUpdate.users && roomUpdate.users[userId]) {
      roomUpdate.users[userId].current = true;
    }
    if (isDev) console.log('Parsing update', roomUpdate);
    setRoom({...roomUpdate});
  }, [userId]);

  function initialUserId() {
    if (!isDev || !PERSIST_USER) return null;
    return sessionStorage.getItem(roomId);
  };

  // Watch for room updates.
  useEffect(() => {
    db.watchRoom(roomId, snapshot => {
      // TODO: Switch to an explaining page.
      if (!snapshot) {
        history.push('/room-not-found');
        return;
      }
      parseAndSetRoom(snapshot);
    });

    return () => {
      db.unwatchRoom(roomId);
    };
  }, [roomId, parseAndSetRoom]);

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
              <Board roomId={roomId} userId={userId} game={room.game} user={room.users[userId]} />
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