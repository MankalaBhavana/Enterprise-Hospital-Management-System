import React, { useEffect, useState } from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import PatientRecordPage from "./components/patientRecord/PatientRecordPage"
import { patientCodeFromHash } from "./components/patientRecord/patientRecord"
import "./index.css"

// `#/patient/<code>` is the page a scanned OP card opens in its own tab: the
// patient's complete record, outside the app shell. Everything else is the app.
function Root() {
  const [code, setCode] = useState(() => patientCodeFromHash())
  useEffect(() => {
    const onHash = () => setCode(patientCodeFromHash())
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])
  return code ? <PatientRecordPage key={code} code={code} /> : <App />
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
