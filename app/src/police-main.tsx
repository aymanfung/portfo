import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { PoliceTest } from "./pages/PoliceTest.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PoliceTest />
  </StrictMode>,
)
