import { Navigate, Route, Routes } from "react-router-dom";

import MockShellPage from "./MockShellPage.js";
import PlaySpikePage from "./PlaySpikePage.js";

export default function App() {
  return (
    <Routes>
      <Route element={<MockShellPage />} path="/" />
      <Route element={<PlaySpikePage />} path="/play/spike" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
