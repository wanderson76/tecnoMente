import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // Mantém a folha principal de estilos
import App from './App.jsx'

// Forçador de Background e Reset de Body direto na raiz da janela
// Isso remove o fundo preto clássico do CSS cyberpunk antigo imediatamente
if (typeof document !== 'undefined') {
  const body = document.body;
  body.style.margin = "0";
  body.style.padding = "0";
  body.style.backgroundColor = "#030712";
  body.style.background = "radial-gradient(circle at top, #0f1123 0%, #030712 70%, #050508 100%)";
  body.style.minHeight = "100vh";
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)