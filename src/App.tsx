import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AppShell } from "./shell/AppShell"
import { FeedScreen } from "./screens/FeedScreen"
import { CalendarScreen } from "./screens/CalendarScreen"
import { CardsScreen } from "./screens/CardsScreen"
import { AddCardScreen } from "./screens/AddCardScreen"
import { CardDetailScreen } from "./screens/CardDetailScreen"
import { UsScreen } from "./screens/UsScreen"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell><FeedScreen /></AppShell>} />
        <Route path="/calendar" element={<AppShell><CalendarScreen /></AppShell>} />
        <Route path="/cards" element={<AppShell><CardsScreen /></AppShell>} />
        <Route path="/us" element={<AppShell><UsScreen /></AppShell>} />
        {/* Full-screen overlays — no tab bar, matching the cards-3 Figma frame. */}
        <Route path="/cards/new" element={<AppShell tabBar={false}><AddCardScreen /></AppShell>} />
        <Route path="/cards/:id" element={<AppShell tabBar={false}><CardDetailScreen /></AppShell>} />
      </Routes>
    </BrowserRouter>
  )
}
