// Entry point of the admin website. The browser loads this file first.
// Vite builds the app from here, and index.html has an empty <div id="root">.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// createRoot attaches React to that #root div. render() draws <App /> inside it.
// StrictMode is a development helper. It runs some code twice to reveal bugs.
// It does nothing in the production build.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
