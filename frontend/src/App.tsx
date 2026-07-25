import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppHeader } from "./components/layout/AppHeader";
import { BottomNavigation } from "./components/layout/BottomNavigation";
import { AppProvider } from "./context/AppContext";
import { HomePage } from "./pages/HomePage";
import { RegisterPage } from "./pages/RegisterPage";
import { InventoryPage } from "./pages/InventoryPage";
import { DebtsPage } from "./pages/DebtsPage";
import { AssistantPage } from "./pages/AssistantPage";
import { HistoryPage } from "./pages/HistoryPage";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-surface-alt flex justify-center">
          <div className="w-full max-w-md bg-surface-alt min-h-screen relative shadow-sm">
            <AppHeader />
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/registrar" element={<RegisterPage />} />
                <Route path="/inventario" element={<InventoryPage />} />
                <Route path="/deudas" element={<DebtsPage />} />
                <Route path="/historial" element={<HistoryPage />} />
                <Route path="/asistente" element={<AssistantPage />} />
              </Routes>
            </main>
            <BottomNavigation />
          </div>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
