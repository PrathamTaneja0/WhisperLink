import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/Landing';
import { StartSessionPage } from './pages/StartSession';
import { JoinSessionPage } from './pages/JoinSession';
import { RoomPage } from './pages/Room';
import { PrivacyPage } from './pages/Privacy';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/start" element={<StartSessionPage />} />
        <Route path="/join" element={<JoinSessionPage />} />
        <Route path="/r/:roomId" element={<RoomPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
    </BrowserRouter>
  );
}
