import commonCss from '../common/common.module.scss'
import css from './join.module.scss';
import homeCss from '../home/home.module.scss';
import React, {useState} from 'react';
import {getFetchUrl} from '../common/util';
import { useEffect } from 'react';

const Join = React.memo(props => {
  const {roomId, userId, setUserId} = props;

  const [name, setName] = useState('');
  const [nameTakenError, setNameTakenError] = useState(false);
  const [creating, setCreating] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

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
        setName('');
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

  useEffect(() => {
    if (userId) {
      setTimeout(() => setShouldRender(false), 250);
    }
  }, [userId]);

  if (!shouldRender) return (<React.Fragment></React.Fragment>)
  return (
    <div className={css.join} data-closing={Boolean(userId)}>
      <div className={css.modal}>
        <div className={css.instructions}>Enter a nickname to join:</div>
        <div className={`${homeCss.input} ${css.input}`}>
          <form onSubmit={joinRoom}>
            <input 
              type="text"
              className={homeCss.textInput}
              value={name}
              onChange={handleNameInput}
              disabled={Boolean(creating || userId)}
              autoFocus
            />
          </form>
          <div className={`${css.controls} ${commonCss.controls}`}>
            <div onClick={joinRoom} data-disabled={Boolean(creating || userId)}>
              Join
            </div>
          </div>
          {nameTakenError && 
            <div className={css.error}>This name is already taken!</div>
          }
        </div>
      </div>
    </div>
  );
});
export default Join;