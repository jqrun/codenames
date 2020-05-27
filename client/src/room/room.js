import db from '../common/database';
import Board from './board';
import css from './room.module.scss'
import Join from './join';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import Teams from './teams';
import {getFetchUrl, isDev} from '../common/util';
import {useHistory} from "react-router-dom";
import {useParams} from 'react-router-dom';

// Toggle for local development.
const PERSIST_USER = true;

export default function Room() {
  const {roomId} = useParams();
  const history = useHistory();

  const [userId, setUserId] = useState(initialUserId);
  const [room, setRoom] = useState(null);
  const [users, setUsers] = useState(null);
  const [game, setGame] = useState(null);
  const [messages, setMessages] = useState(null);
  const [loading, setLoading] = useState(true);

  function initialUserId() {
    if (!isDev || !PERSIST_USER) return null;
    return sessionStorage.getItem(roomId);
  };

  // Check if room exists.
  useEffect(() => {
    if (!roomId) return;
    db.getRoom(roomId, snapshot => {
      // TODO: Switch to an explaining page.
      if (!snapshot) {
        history.push('/room-not-found');
        return;
      }
      if (isDev) console.log('Room fetch', snapshot);
      setRoom(snapshot);
    });

    return () => db.unwatch('rooms', roomId);
  }, [roomId]);

  // Watch for users, game, and messages updates.
  useEffect(() => {
    if (!userId) return;
    db.watch('users', roomId, snapshot => {
      if (isDev) console.log('Users update', snapshot);
      if (snapshot && snapshot[userId]) snapshot[userId].current = true;
      setUsers(snapshot);
    });

    db.watch('games', roomId, snapshot => {
      if (isDev) console.log('Game update', snapshot);
      setGame(snapshot);
    });

   db.watch('messages', roomId, snapshot => {
      if (isDev) console.log('Messages update', snapshot);
      setMessages(snapshot);
    });

    return () => {
      ['users', 'games', 'messages'].forEach(path => {
        db.unwatch(path, roomId);
      });
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
    if (!roomId || !userId || !room || !users || !game) return;
    setLoading(false);
  }, [roomId, userId, room, users, game]);

  if (!room) return (<div></div>);
  return (
    <React.Fragment>
      {!userId && <Join roomId={roomId} setUserId={setUserId} />}

      {!loading && <div className={css.room}>
        <div className={css.inner}>
          <div className={css.left}>
            <div className={css.board}>
              <Board roomId={roomId} userId={userId} game={game} user={users[userId]} />
            </div>
          </div>

          <div className={css.right}>
            <div className={css.teams}>
              <Teams roomId={roomId} userId={userId} users={users} />
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