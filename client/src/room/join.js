import React, {useEffect, useState} from 'react';
import styles from './join.module.scss';
import {serverUrl} from '../common/util';

export default function Join(props) {
  const userStorageKey = `${props.roomId}-userId`;
  const existingUser = window.sessionStorage.getItem(userStorageKey);

  const createUser = async (nickname) => {
    const url = `${serverUrl}/rooms/${props.roomId}/users/create/${nickname}`;
    const response = await fetch(url, {method: 'POST'});
    const data = await response.json();
    window.sessionStorage.setItem(userStorageKey, nickname);
    props.setUser({nickname});
  };

  useEffect(() => {
    if (existingUser) {
      props.setUser({nickname: existingUser});
      return;
    }

    const nickname = window.prompt('Enter a nickname');
    createUser(nickname);
  }, []);

  return (<React.Fragment>Hey</React.Fragment>);
}