import {getFetchUrl, isDev} from '../common/util';
import {useHistory} from "react-router-dom";
import {useParams} from 'react-router-dom';
import Board from './board';
import Chat from './chat';
import css from './room.module.scss'
import db from '../common/database';
import Join from './join';
import React, {useEffect, useState} from 'react';
import Teams from './teams';

// Toggle for local development.
const PERSIST_USER = true;

export default function Room() {
  const {roomId} = useParams();
  const history = useHistory();

  const [userId, setUserId] = useState(initUserId);
  const [room, setRoom] = useState(null);
  const [users, setUsers] = useState({});
  const [game, setGame] = useState(null);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);

  const user = users[userId];

  function initUserId() {
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
    if (!roomId) return;

    const convertTeam = {b: 'blue', r: 'red', g: 'game'};
    const convertType = {b: 'blue', r: 'red', y: 'bystander', a: 'assassin'};
    const convertCurrentTurn = {b: 'blue', r: 'red', bw: 'blue_win', rw: 'red_win'};

    const convertUser = user => ({
      userId: user.i,
      name: user.n,
      team: convertTeam[user.t],
      spymaster: Boolean(user.s),
      current: user.current,
    });

    const convertCard = card => ({
      index: card.i,
      word: card.w,
      type: convertType[card.t],
      revealed: Boolean(card.r),
    });

    const convertGame = game => {
      const board = {};
      Object.values(game.b).forEach(card => {
        board[card.i] = convertCard(card);
      });
      return {
        board,
        currentTurn: convertCurrentTurn[game.c],
      };
    };
    
    const convertMessage = message => {
      const converted = {
        messageId: message.i,
        text: message.t,
        sender: message.s,
        team: convertTeam[message.e],
        timestamp: message.m,
      };
      if (message.e === 'g') {
        converted.sender = null;
        if (message.t.includes(',')) {
          const [word, type] = message.t.split(',');
          converted.text = `${message.s} revealed ${word} (${convertType[type]})`;
        } else {
          const convertWin = {bw: 'BLUE WINS!', rw: 'RED WINS!'};
          converted.text = convertWin[message.t];
        }
      }
      return converted;
    };

    db.watch(`users/${roomId}`, 'child_added', snapshot => {
      if (isDev) console.log('User add', snapshot);
      setUsers(prevUsers => {
        prevUsers[snapshot.i] = convertUser(snapshot);
        console.log(prevUsers);
        return {...prevUsers};
      });
    });

    db.watch(`users/${roomId}`, 'child_removed', snapshot => {
      if (isDev) console.log('User remove', snapshot);
      setUsers(prevUsers => {
        delete prevUsers[snapshot.i];
        return {...prevUsers};
      });
    });


    db.watch(`users/${roomId}`, 'child_changed', snapshot => {
      if (isDev) console.log('User change', snapshot);
      setUsers(prevUsers => {
        prevUsers[snapshot.i] = convertUser(snapshot);
        return {...prevUsers};
      });
    });


    db.get(`games/${roomId}`, snapshot => {
      if (isDev) console.log('Initial game', snapshot);
      console.log(convertGame(snapshot));
      setGame(convertGame(snapshot));

      db.watch(`games/${roomId}/c`, 'value', snapshot => {
        if (isDev) console.log('CurrentTurn update', snapshot);
        setGame(prevGame => {
          prevGame.currentTurn = convertCurrentTurn[snapshot];
          return {...prevGame};
        });
      });

      db.watch(`games/${roomId}/b`, 'child_changed', snapshot => {
        if (isDev) console.log('Board change', snapshot);
        setGame(prevGame => {
          prevGame.board[snapshot.i] = convertCard(snapshot);
          return {...prevGame};
        });
      });
    });

    db.watch(`messages/${roomId}`, 'child_added', snapshot => {
      if (isDev) console.log('Message add', snapshot);
      setMessages(prevMessages => {
        prevMessages[snapshot.i] = convertMessage(snapshot);
        return {...prevMessages};
      });
    });

    return () => db.unwatchAll();
  }, [roomId]);

  useEffect(() => {
    if (!userId) return;

    setUsers(prevUsers => {
      Object.entries(prevUsers).forEach(([key, value]) => {
        if (key === userId) {
          prevUsers[key].current = true;
          return {...prevUsers};
        }
      })
      return {...prevUsers};
    });
  }, [userId]);

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
    if (!roomId || !room || !users || !game) return;
    setLoading(false);
  }, [roomId, room, users, game]);

  if (!room) return (<div></div>);
  return (
    <div className={css.room}>
      <Join roomId={roomId} userId={userId} setUserId={setUserId} />

      {!loading && <div className={css.inner}>
        <div className={css.left}>
          <div className={css.board}>
            <Board roomId={roomId} game={game} user={user} />
          </div>
        </div>

        <div className={css.right}>
          <div className={css.teams}>
            <Teams roomId={roomId} userId={userId} users={users} />
          </div>

          <div className={css.chat}>
            <Chat roomId={roomId} user={user} messages={messages} setMessages={setMessages} />
          </div>
        </div>
      </div>}
    </div>
  );  
}