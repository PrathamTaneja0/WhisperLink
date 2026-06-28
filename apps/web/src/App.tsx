import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import { AppLayout } from './components/app/AppLayout';
import { LandingPage } from './pages/Landing';
import { StartSessionPage } from './pages/StartSession';
import { JoinSessionPage } from './pages/JoinSession';
import { SessionEndedPage } from './pages/SessionEnded';
import { RoomPage } from './pages/Room';
import { PrivacyPage } from './pages/Privacy';

export function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/start" element={<StartSessionPage />} />
            <Route path="/join" element={<JoinSessionPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/session-ended" element={<SessionEndedPage />} />
          </Route>
          <Route path="/r/:roomId" element={<RoomPage />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
}
