import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const savedTwmTheme = localStorage.getItem('twm_theme') || 'light'
document.documentElement.setAttribute('data-theme', savedTwmTheme)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
