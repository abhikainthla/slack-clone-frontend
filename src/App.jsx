import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Workspace from "./pages/Workspace";
import MainLayout from "./components/layout/MainLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Workspace selection */}
        <Route path="/workspace" element={<Workspace />} />

        {/* Main App Layout */}
        <Route path="/workspace/:id" element={<MainLayout />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
