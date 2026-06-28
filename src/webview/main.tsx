import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { getInitialLanguage, initI18n } from './i18n';
import './styles.css';

initI18n(getInitialLanguage());

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
