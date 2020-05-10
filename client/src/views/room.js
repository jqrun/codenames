import styles from './room.module.scss';
import React, {useState} from 'react';
import {useParams} from 'react-router-dom';

export default function Room() {
  const {roomId} = useParams();

  return (
    <div style={styles.room}>
      Room {roomId}
    </div>
  );  
}