import { Navigate, Route, Routes } from "react-router-dom";

import MockShellPage from "./MockShellPage.js";
import PlaySpikePage from "./PlaySpikePage.js";

export default function App() {
  return (
    <Routes>
      <Route element={<PlaySpikePage />} path="/" />
      <Route element={<PlaySpikePage />} path="/play/spike" />
      <Route element={<MockShellPage />} path="/mock" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
