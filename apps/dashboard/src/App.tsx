import { Route, Routes } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Usage } from './pages/Usage';
import { Projects } from './pages/Projects';
import { Models } from './pages/Models';
import { Sessions } from './pages/Sessions';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/usage" element={<Usage />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/models" element={<Models />} />
      <Route path="/sessions" element={<Sessions />} />
    </Routes>
  );
}
