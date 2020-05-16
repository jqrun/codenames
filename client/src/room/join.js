import React, {useEffect, useState} from 'react';
import styles from './join.module.scss';
import {serverUrl} from '../common/util';

export default function Join(props) {
  const {roomId, setUser} = props;

  useEffect(() => {
    const createUser = async (nickname) => {
      const url = `${serverUrl}/rooms/${roomId}/users/create/${nickname}`;
      const response = await fetch(url, {method: 'POST'});
      const {status, userId} = await response.json();
      console.log(status);
      console.log(userId);

      switch(status) {
        case 'nickname_taken':
          return false;
        case 'created':
          setUser({userId, nickname});
          return true;
        default:
      }
    };

    (async () => {
      let succeeded;
      while (!succeeded) {
        const nickname = window.prompt('Enter a nickname');
        succeeded = await createUser(nickname);
      }
    })();

  }, [roomId, setUser]);

  return (<React.Fragment>Hey</React.Fragment>);
}