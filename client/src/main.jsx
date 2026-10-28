import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Import i18n configuration
import './i18n.js';

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
