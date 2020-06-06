import {getFetchUrl} from '../common/util';
import commonCss from './common.module.scss'
import css from './footer.module.scss'
import React, {useEffect, useState} from 'react';

const DEFAULT_TITLE = 'Leave a message:';

export default function Footer() {

  const [textInput, setTextInput] = useState('');
  const [feedbackTitle, setFeedbackTitle] = useState(DEFAULT_TITLE);
  const [showFeedback, setShowFeedback] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleTextInput(event) {
    const newText = event.target.value;
    setTextInput(newText);
  }

  async function submitFeedback() {
    setFeedbackTitle('Thanks for the feedback!');
    setSubmitting(true);
    const url = getFetchUrl(null, '/feedback');
    await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({feedback: textInput}),
    });
    setSubmitting(false);
    setTextInput('');
    setShowFeedback(false);
  }

  useEffect(() => {
    if (showFeedback) {
      setFeedbackTitle(DEFAULT_TITLE);
    }
  }, [showFeedback]);

  return (
    <div className={css.footer}>
      <div className={css.content}>
        created by jq.run | &nbsp;
        <span className={css.feedback} onClick={() => setShowFeedback(true)}>
          write feedback
        </span>
      </div>
      <div 
        className={css.feedbackScrim} 
        data-show-feedback={showFeedback}
        onClick={() => setShowFeedback(false)}
      >
        <div className={css.feedbackInner} onClick={(e) => e.stopPropagation()}>
          <div className={css.feedbackTitle}>
           {feedbackTitle}
          </div>
          <div className={css.feedbackInput}>
            <textarea 
              className={css.textInput} 
              value={textInput}
              onChange={handleTextInput}
              maxLength="500" 
              disabled={submitting}
            />
            <div className={`${commonCss.controls} ${css.controls}`}>
              <div 
                className={css.submit} 
                data-disabled={submitting || !textInput}
                onClick={submitFeedback}
              >
                Submit
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}