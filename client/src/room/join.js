import React, {useEffect, useState} from 'react';
import styles from './join.module.scss';
import {serverUrl} from '../common/util';

const Join = React.memo(props => {
  const {roomId, setUser} = props;

  const [name, setName] = useState('');
  const [nameTakenError, setNameTakenError] = useState(false);

  const createUser = async (name) => {
    const url = `${serverUrl}/rooms/${roomId}/users/create/${name}`;
    const response = await fetch(url, {method: 'POST'});
    const {status, userId} = await response.json();

    switch(status) {
      case 'name_taken':
        setNameTakenError(true);
        break;
      case 'created':
        setUser({userId, name});
        break;
      default:
    }
  };

  const joinRoom = (event) => {
    event.preventDefault();
    createUser(name);
  };

  return (
    <div className={styles.join}>
      Enter a name to join!
      <form onSubmit={joinRoom}>
        <input 
          type="text"
          className={styles.input} 
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
      </form>
      {nameTakenError && 
        <div style={{color: "red"}}>This name is already taken!</div>
      }
    </div>
  );
});
export default Join;