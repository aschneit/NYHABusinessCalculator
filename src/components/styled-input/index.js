import './style.css';
import React from 'react';

const StyledInput = ({ typeCharacter, className: passedClass, ...props }) => (
  <div className={`styled-input ${passedClass} ${typeCharacter && 'with-type-character'}`}>
    {typeCharacter &&
      <span className="type-character">{typeCharacter}</span>
    }
    <input
      {...props}
    />
  </div>
);


export default StyledInput;
