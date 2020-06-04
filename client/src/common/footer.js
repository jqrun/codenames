import css from './footer.module.scss'
import React from 'react';

export default function Footer() {

  return (
    <div className={css.footer}>
      <div className={css.content}>
        created by jq.run | &nbsp;
        <span className={css.feedback}>
          write feedback
        </span>
      </div>
    </div>
  );
}