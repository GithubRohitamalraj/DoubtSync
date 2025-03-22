import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import ProfileInformation from './components/ProfileInformation';
import MentorProfileView from './components/MentorProfileView';
import DynamicMessagePanel from './components/DynamicMessagePanel';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/complete-profile" element={<ProfileInformation />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mentor/:id" element={<MentorProfileView />} />
        <Route path="/edit-profile" element={<ProfileInformation />} />
        
        
        
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;