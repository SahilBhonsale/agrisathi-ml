import React, { useEffect, useState } from 'react';
import { FiBookOpen, FiMessageSquare, FiPackage, FiRefreshCw, FiUsers } from 'react-icons/fi';
import config from '../config/config';
import '../styles/AdminPanel.css';

const cards = [
  ['users', 'Members', FiUsers],
  ['products', 'Active products', FiPackage],
  ['questions', 'Forum questions', FiMessageSquare],
  ['careTips', 'Care guides', FiBookOpen]
];

function AdminPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(config.getApiUrl('/api/admin/overview'), { credentials: 'include' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to load administration data');
      setData(result.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOverview(); }, []);

  if (loading) return <div className="admin-state">Loading administration workspace…</div>;
  if (error) return <div className="admin-state error"><p>{error}</p><button className="button button-secondary" onClick={loadOverview}><FiRefreshCw /> Retry</button></div>;

  return (
    <div className="admin-panel page-shell">
      <div className="page-heading"><div><span className="eyebrow">Platform management</span><h1>Administration</h1><p>Monitor the AgriSathi community, marketplace and knowledge library.</p></div><button className="button button-secondary" onClick={loadOverview}><FiRefreshCw /> Refresh</button></div>
      <section className="admin-metrics">
        {cards.map(([key, label, Icon]) => <article key={key}><span>{React.createElement(Icon)}</span><div><strong>{data.counts[key]}</strong><small>{label}</small></div></article>)}
      </section>
      <div className="admin-grid">
        <section className="admin-table-card"><header><h2>Recent members</h2></header><div className="admin-list">{data.recentUsers.map((item) => <div key={item._id}><span className="list-avatar">{item.name.charAt(0)}</span><span><strong>{item.name}</strong><small>{item.email}</small></span><em>{item.isAdmin ? 'Admin' : item.authProvider}</em></div>)}</div></section>
        <section className="admin-table-card"><header><h2>Recent products</h2></header><div className="admin-list">{data.recentProducts.map((item) => <div key={item._id}><span className="list-avatar product">₹</span><span><strong>{item.title}</strong><small>{item.category}</small></span><em>₹{item.price}</em></div>)}</div></section>
        <section className="admin-table-card wide"><header><h2>Recent community questions</h2></header><div className="admin-list compact">{data.recentQuestions.map((item) => <div key={item._id}><span><strong>{item.title}</strong><small>{item.category}</small></span><em>{new Date(item.createdAt).toLocaleDateString('en-IN')}</em></div>)}</div></section>
      </div>
    </div>
  );
}

export default AdminPanel;
