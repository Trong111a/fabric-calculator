import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const root = document.getElementById('root')
root.setAttribute('translate', 'no')
root.classList.add('notranslate')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)