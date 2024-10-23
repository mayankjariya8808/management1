import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashbord';  // Fixed typo in import
import Members from './components/Members';
import Expense from './components/Expense';
import Login from './components/Login';  // Import Login component

// Component to protect routes
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Login />
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/workspace/:workspaceId" 
          element={
            <ProtectedRoute>
              <Members />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/workspace/:workspaceId/member/:memberId/expenses" 
          element={
            <ProtectedRoute>
              <Expense />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
