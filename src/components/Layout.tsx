import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, Apple, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Layout = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* Sidebar for Desktop / Bottom Nav for Mobile */}
      <nav className="navigation-bar glass-panel">
        <div className="nav-brand">
          <div className="nav-logo">
            <Activity size={28} color="var(--accent-primary)" />
            <span className="text-gradient brand-text">Vitality</span>
          </div>
        </div>

        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={24} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/workouts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Activity size={24} />
            <span>Workouts</span>
          </NavLink>
          <NavLink to="/nutrition" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Apple size={24} />
            <span>Nutrition</span>
          </NavLink>
        </div>

        <div className="nav-footer">
          <div className="user-profile">
            <div className="avatar">
              <User size={20} />
            </div>
            <span className="user-name">User</span>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="content-area">
        <div className="top-bar">
          <h1 className="page-title">
            <span className="text-gradient">Welcome back,</span> User
          </h1>
          <div className="top-bar-date">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
