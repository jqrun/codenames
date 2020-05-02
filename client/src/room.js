import './room.module.scss';
import React from 'react';
import {useParams} from 'react-router-dom';

export default function Room() {

  const {roomId} = useParams();

  return (
    <div>Room {roomId}</div>
  );  
}