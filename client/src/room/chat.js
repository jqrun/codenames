import {getFetchUrl} from '../common/util';
import commonCss from '../common/common.module.scss'
import css from './chat.module.scss'
import React, {useEffect, useRef, useState} from 'react';

const DEFAULT_PLACEHOLDER = 'Send a chat message';

export default function Chat(props) {
  const {roomId, user, messages, setMessages} = props;

  const messagesList = getMessagesList();

  const [messageText, setMessageText] = useState('');
  const [sentCounter, setSendCounter] = useState(0);
  const [spamTimeout, setSpamTimeout] = useState(false);
  const [placeholder, setPlaceholder] = useState(DEFAULT_PLACEHOLDER);

  const messagesRef = useRef();
  const spamCounterRef = useRef(0);

  function getMessagesList() {
    const list = Object.values(messages);
    list.sort((a, b) => {
      if (a.pending && !b.pending) return 1;
      if (!a.pending && b.pending) return -1;

      if (a.timestamp < b.timestamp) return -1;
      if (a.timestamp > b.timestamp) return 1;
      return 0;
    });
    return list;
  }

  function handleTextInput(event) {
    let text = event.target.value;
    text = text.slice(0, 500);
    setMessageText(text);
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!messageText) return;

    const text = messageText;
    const messageId = getMessageId();
    setMessageText('');

    const pendingMessage = {
      messageId,
      pending: true,
      sender: user.name,
      team: user.team,      
      text,
      timestamp: Number(Date.now()),
    };
    setMessages(prevMessages => {
      prevMessages[messageId] = pendingMessage;
      return {...prevMessages};
    });

    const url = getFetchUrl(roomId, '/messages/create', {
      messageId,
      roomId, 
      sender: encodeURIComponent(user.name),
      team: user.team, 
      text: encodeURIComponent(messageText),
    });
    fetch(url, {method: 'POST'});

    checkForSpam();
  }

  function checkForSpam() {
    spamCounterRef.current++;
    setTimeout(() => spamCounterRef.current-- , 2000);
    if (spamCounterRef.current >= 6) {
      setSpamTimeout(true);
      setPlaceholder('Typing too fast... (3)');
      setTimeout(() => setPlaceholder('Typing too fast... (2)'), 1000);
      setTimeout(() => setPlaceholder('Typing too fast... (1)'), 2000);
      setTimeout(() => {
        setSpamTimeout(false);
        setPlaceholder(DEFAULT_PLACEHOLDER);
      }, 3000);
    } 
  }

  function getMessageId() {
    const messageId = `${user.userId}${sentCounter}`;
    setSendCounter(prev => prev + 1);
    return messageId;
  }

  useEffect(() => {
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className={css.chat}>
      <div className={css.messages} ref={messagesRef}>
        {messagesList.map(message => 
          <div 
            key={message.messageId}
            className={css.message} 
            data-team={message.team}
            data-pending={message.pending}
          >
            {message.sender && 
              <span className={css.sender} data-team={message.team}>
                {message.sender}:
              </span>
            }
            <span className={css.text}>{message.text}</span>
          </div>
        )}
      </div>
      <div className={`${css.messageInput} ${commonCss.controls}`}>
        <form onSubmit={sendMessage}>
          <input 
            type="text"
            placeholder={placeholder}
            className={css.textInput}
            value={messageText}
            onChange={handleTextInput}
            disabled={spamTimeout}
            data-spam-timeout={spamTimeout}
          />
        </form>
        <div 
          className={css.sendButton} 
          onClick={sendMessage} 
          data-disabled={spamTimeout}
        > 
          Send
        </div>
      </div>
    </div>
  );
}