import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AppShell } from "./shell/AppShell"
import { FeedScreen } from "./screens/FeedScreen"
import { CalendarScreen } from "./screens/CalendarScreen"
import { CardsScreen } from "./screens/CardsScreen"
import { UsScreen } from "./screens/UsScreen"

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<FeedScreen />} />
          <Route path="/calendar" element={<CalendarScreen />} />
          <Route path="/cards" element={<CardsScreen />} />
          <Route path="/us" element={<UsScreen />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
