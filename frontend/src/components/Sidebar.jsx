import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiBookOpen, FiCamera, FiCloudRain, FiHome, FiMessageCircle, FiShoppingBag, FiUser, FiUsers, FiShield, FiZap } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

const items = [
  ['/', 'Dashboard', FiHome],
  ['/scanner', 'Plant health', FiCamera],
  ['/care-tips', 'Care library', FiBookOpen],
  ['/marketplace', 'Marketplace', FiShoppingBag],
  ['/chatbot', 'Agri assistant', FiMessageCircle],
  ['/forum', 'Community', FiUsers],
  ['/weather', 'Weather', FiCloudRain],
  ['/profile', 'My profile', FiUser]
];

function Sidebar() {
  const { user } = useAuth();
  return (
    <aside className="sidebar">
      <div className="sidebar-label">Workspace</div>
      <nav className="sidebar-nav">
        {items.map(([to, label, Icon]) => (
          <NavLink key={to} to={to} end={to === '/'} title={label}>
            {React.createElement(Icon)}
            <span>{label}</span>
          </NavLink>
        ))}
        {user?.isAdmin && <NavLink to="/admin"><FiShield /><span>Administration</span></NavLink>}
      </nav>
      <div className="sidebar-support">
        <FiZap /><div><strong>Field AI</strong><span>Online</span></div>
      </div>
    </aside>
  );
}

export default Sidebar;
