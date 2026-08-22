import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiArrowRight, FiBookOpen, FiCamera, FiCloudRain, FiMessageCircle, FiShoppingBag, FiUsers } from 'react-icons/fi';
import '../styles/Dashboard.css';

const actions = [
  { to: '/scanner', icon: FiCamera, title: 'Check plant health', text: 'Upload a clear leaf photo for an AI-assisted visual assessment.', color: 'forest' },
  { to: '/care-tips', icon: FiBookOpen, title: 'Explore care guides', text: 'Find watering, sunlight, disease and treatment guidance.', color: 'leaf' },
  { to: '/marketplace', icon: FiShoppingBag, title: 'Visit marketplace', text: 'Discover farm inputs, tools and produce from the community.', color: 'earth' },
  { to: '/chatbot', icon: FiMessageCircle, title: 'Ask AgriSathi AI', text: 'Get fast, practical answers for everyday farming decisions.', color: 'sun' }
];

function Dashboard({ user }) {
  return (
    <div className="dashboard page-shell">
      <section className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-kicker"><span className="live-dot" /> Monsoon workspace · Live</div>
          <h1>Grow with<br/><em>clarity.</em></h1>
          <p>Namaste, {user?.name?.split(' ')[0] || 'Farmer'}. Your crops, climate intelligence and farming community now move as one living system.</p>
          <div className="hero-actions">
            <NavLink to="/scanner" className="button button-primary"><FiCamera /> Scan a plant</NavLink>
            <NavLink to="/weather" className="button button-secondary"><FiCloudRain /> View forecast</NavLink>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <span className="orbit orbit-one" /><span className="orbit orbit-two" />
          <div className="sun-disc" />
          <div className="field field-back" />
          <div className="field field-front" />
          <div className="sprout-mark"><span className="stem"/><span className="leaf leaf-left"/><span className="leaf leaf-right"/></div>
          <div className="hero-metric"><span>FIELD SIGNAL</span><strong>Healthy</strong><small>Conditions look favourable</small></div>
        </div>
        <div className="hero-index">01 — FIELD COMMAND</div>
      </section>

      <section className="dashboard-strip">
        <div><FiCloudRain /><span><small>Seasonal focus</small><strong>Monsoon crop care</strong></span></div>
        <div><FiUsers /><span><small>Community</small><strong>Ask and share locally</strong></span></div>
        <div><FiBookOpen /><span><small>Knowledge base</small><strong>Practical plant guides</strong></span></div>
      </section>

      <div className="section-heading">
        <div><span className="eyebrow">Your field instruments</span><h2>Four ways to move forward.</h2></div>
        <p>Choose a tool. Turn uncertainty into the next clear action.</p>
      </div>
      <section className="action-grid">
        {actions.map(({ to, icon: Icon, title, text, color }, index) => (
          <NavLink key={to} to={to} className={`action-card ${color}`}>
            <span className="action-number">0{index + 1}</span><span className="action-icon">{React.createElement(Icon)}</span><h3>{title}</h3><p>{text}</p><span className="action-link">Open instrument <FiArrowRight /></span>
          </NavLink>
        ))}
      </section>

      <section className="advisory-card">
        <span className="advisory-number">FIELD NOTE / 07</span><div><span className="eyebrow">This week’s field note</span><h2>Protect roots during sustained rain</h2><p>Keep drainage channels clear, avoid working waterlogged soil, inspect lower leaves for fungal spots, and apply treatments only after confirming the cause.</p></div>
        <NavLink to="/care-tips" className="button button-secondary">Read care guides <FiArrowRight /></NavLink>
      </section>
    </div>
  );
}

export default Dashboard;
