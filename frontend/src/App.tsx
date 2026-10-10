import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TeachersPage from './pages/Teachers';
import GradesPage from './pages/Grades';
import SubjectsPage from './pages/Subjects';
import ClassroomsPage from './pages/Classrooms';
import AssignmentsPage from './pages/Assignments';
import ConstraintsPage from './pages/Constraints';
import GeneratePage from './pages/Generate';
import SettingsPage from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="teachers"    element={<TeachersPage />} />
          <Route path="grades"      element={<GradesPage />} />
          <Route path="subjects"    element={<SubjectsPage />} />
          <Route path="classrooms"  element={<ClassroomsPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="constraints" element={<ConstraintsPage />} />
          <Route path="generate"    element={<GeneratePage />} />
          <Route path="settings"    element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
