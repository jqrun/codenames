import Board from './board';
import Chat from './chat';
import css from './room.module.scss'
import db from '../common/database';
import Join from './join';
import React, {useEffect, useState} from 'react';
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
  const [users, setUsers] = useState({});
  const [game, setGame] = useState(null);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);

  function initialUserId() {
    if (!isDev || !PERSIST_USER) return null;
    return sessionStorage.getItem(roomId);
  };

  // Fetch initial room.
  useEffect(() => {
    if (!roomId) return;
    db.get(`rooms/${roomId}`, snapshot => {
      // TODO: Switch to an explaining page.
      if (!snapshot) {
        history.push('/room-not-found');
        return;
      }
      if (isDev) console.log('Initial room', snapshot);
      setRoom(snapshot);
    });
  }, [roomId, history]);

  // Watch for users, game, and messages updates.
  useEffect(() => {
    if (!userId) return;

    db.watch(`users/${roomId}`, 'child_added', snapshot => {
      if (isDev) console.log('User add', snapshot);
      setUsers(prevUsers => {
        if (snapshot.userId === userId) snapshot.current = true;
        prevUsers[snapshot.userId] = snapshot;
        return {...prevUsers};
      });
    });

    db.watch(`users/${roomId}`, 'child_removed', snapshot => {
      if (isDev) console.log('User remove', snapshot);
      setUsers(prevUsers => {
        delete prevUsers[snapshot.userId];
        return {...prevUsers};
      });
    });


    db.watch(`users/${roomId}`, 'child_changed', snapshot => {
      if (isDev) console.log('User change', snapshot);
      setUsers(prevUsers => {
        prevUsers[snapshot.userId] = snapshot;
        return {...prevUsers};
      });
    });


    db.get(`games/${roomId}`, snapshot => {
      if (isDev) console.log('Initial game', snapshot);
      setGame(snapshot);

      db.watch(`games/${roomId}/currentTurn`, 'value', snapshot => {
        if (isDev) console.log('CurrentTurn update', snapshot);
        setGame(prevGame => {
          prevGame.currentTurn = snapshot;
          return {...prevGame};
        });
      });

      db.watch(`games/${roomId}/board`, 'child_changed', snapshot => {
        if (isDev) console.log('Board change', snapshot);
        setGame(prevGame => {
          prevGame.board[snapshot.index] = snapshot;
          return {...prevGame};
        });
      });
    });

    return () => db.unwatchAll();
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
              <Chat roomId={roomId} userId={userId} messages={messages} />
            </div>
          </div>
        </div>
      </div>}
    </React.Fragment>
  );  
}