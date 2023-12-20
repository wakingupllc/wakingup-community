import React from 'react';
import { formatMessage } from './provider';
import { GENERIC_ERROR_MESSAGE } from '../vulcan-lib';

const FormattedMessage = ({ id, values, defaultMessage = '', html = false, className = '' }: {
  id: string,
  values?: any,
  defaultMessage?: string,
  html?: boolean,
  className?: string
}) => {
  const message = formatMessage({ id, defaultMessage }, values);
  const cssClass = `i18n-message ${className}`;
  const isGenericError = message === GENERIC_ERROR_MESSAGE;

  // If it's the generic error message, treat it as HTML so the mailto link works
  return (html || isGenericError) ?
    <span className={cssClass} dangerouslySetInnerHTML={{__html: message}}/> :
    <span className={cssClass}>{message}</span>;
};

export default FormattedMessage;
