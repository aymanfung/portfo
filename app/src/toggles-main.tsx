import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { TogglesGallery } from "./pages/TogglesGallery.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TogglesGallery />
  </StrictMode>,
)
