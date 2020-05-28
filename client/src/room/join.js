import css from './join.module.scss';
import React, {useState} from 'react';
import {getFetchUrl} from '../common/util';

const Join = React.memo(props => {
  const {roomId, setUserId} = props;

  const [name, setName] = useState('');
  const [nameTakenError, setNameTakenError] = useState(false);
  const [creating, setCreating] = useState(false);

  function handleNameInput(event) {
    let name = event.target.value;
    name = name.slice(0, 15);
    setName(name);
  };

  async function createUser (name) {
    setCreating(true);

    const url = getFetchUrl(roomId, '/users/create', {roomId, name: encodeURIComponent(name)});
    const response = await fetch(url, {method: 'POST'});
    const {status, userId} = await response.json();
    setCreating(false);

    switch(status) {
      case 'name_taken':
        setNameTakenError(true);
        break;
      case 'created':
        sessionStorage.setItem(roomId, userId);
        setUserId(userId);
        break;
      default:
    }
  };

  async function joinRoom(event) {
    event.preventDefault();
    if (!name) return;
    createUser(name);
  };

  return (
    <div className={css.join}>
      Enter a name to join!
      <form onSubmit={joinRoom}>
        <input 
          type="text"
          className={css.input} 
          value={name}
          onChange={handleNameInput}
          disabled={creating}
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