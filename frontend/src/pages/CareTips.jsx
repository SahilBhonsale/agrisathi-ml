import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DOMPurify from 'dompurify';
import {
  FiArrowRight, FiBookOpen, FiCheck, FiDroplet, FiEdit2, FiPlus,
  FiSearch, FiShield, FiSun, FiTrash2, FiX
} from 'react-icons/fi';
import config from '../config/config';
import '../styles/CareTips.css';

const emptyTip = { name: '', watering: '', sunlight: '', remedies: '', diseases: '', plantType: 'Vegetable' };
const categoryOrder = ['All', 'Vegetable', 'Fruit', 'Herb', 'Flower', 'General'];
const displayType = (type) => type === 'General' ? 'Field crop' : type;

function CareTips() {
  const { user } = useAuth();
  const detailRef = useRef(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [tips, setTips] = useState([]);
  const [selectedTipId, setSelectedTipId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTip, setCurrentTip] = useState(emptyTip);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => { fetchCareTips(); }, []);

  const fetchCareTips = async (preferredId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(config.getApiUrl(config.endpoints.careTips), config.getFetchConfig());
      if (!response.ok) throw new Error('Failed to fetch plant guides');
      const result = await response.json();
      const nextTips = Array.isArray(result.data || result) ? (result.data || result) : [];
      setTips(nextTips);
      setSelectedTipId((current) => {
        const wanted = preferredId || current;
        return nextTips.some((tip) => tip._id === wanted) ? wanted : nextTips[0]?._id || null;
      });
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sanitizeInput = (input) => typeof input === 'string' ? DOMPurify.sanitize(input.trim()) : input;

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setCurrentTip((current) => ({ ...current, [name]: value }));
  };

  const openEditor = (tip = null) => {
    setCurrentTip(tip ? { ...emptyTip, ...tip } : emptyTip);
    setIsEditing(true);
    setError(null);
  };

  const resetForm = () => {
    setCurrentTip(emptyTip);
    setIsEditing(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!currentTip.name || !currentTip.watering || !currentTip.sunlight || !currentTip.remedies || !currentTip.diseases) {
      setError('Please complete all guide fields.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload = Object.fromEntries(['name', 'watering', 'sunlight', 'remedies', 'diseases', 'plantType'].map((key) => [key, sanitizeInput(currentTip[key])]));
      const apiUrl = currentTip._id ? `${config.endpoints.careTips}/${currentTip._id}` : config.endpoints.careTips;
      const response = await fetch(config.getApiUrl(apiUrl), config.getFetchConfig({ method: currentTip._id ? 'PUT' : 'POST', body: JSON.stringify(payload) }));
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save guide');
      resetForm();
      await fetchCareTips(data.data?._id);
      setSuccessMessage(currentTip._id ? 'Plant guide updated.' : 'New plant guide published.');
      window.setTimeout(() => setSuccessMessage(null), 3000);
    } catch (submitError) {
      setError(submitError.message);
      setIsLoading(false);
    }
  };

  const handleDelete = async (tip) => {
    if (!window.confirm(`Delete the guide for “${tip.name}”? This cannot be undone.`)) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(config.getApiUrl(`${config.endpoints.careTips}/${tip._id}`), config.getFetchConfig({ method: 'DELETE' }));
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Delete failed');
      await fetchCareTips();
      setSuccessMessage('Plant guide removed.');
      window.setTimeout(() => setSuccessMessage(null), 3000);
    } catch (deleteError) {
      setError(deleteError.message);
      setIsLoading(false);
    }
  };

  const categories = useMemo(() => categoryOrder.filter((item) => item === 'All' || tips.some((tip) => tip.plantType === item)), [tips]);
  const filteredTips = useMemo(() => {
    const search = query.trim().toLowerCase();
    return tips.filter((tip) => {
      const matchesType = category === 'All' || tip.plantType === category;
      const searchable = `${tip.name} ${tip.plantType} ${tip.diseases} ${tip.remedies}`.toLowerCase();
      return matchesType && (!search || searchable.includes(search));
    });
  }, [tips, query, category]);
  const selectedTip = filteredTips.find((tip) => tip._id === selectedTipId) || filteredTips[0] || null;

  const chooseTip = (tip) => {
    setSelectedTipId(tip._id);
    if (window.matchMedia('(max-width: 900px)').matches) window.requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  if (isLoading && tips.length === 0) {
    return <div className="care-tips page-shell"><div className="loading-state"><div><div className="spinner" /><p>Growing your plant library…</p></div></div></div>;
  }

  return (
    <div className="care-tips page-shell">
      <section className="library-hero">
        <div className="library-copy"><span className="eyebrow">The field manual</span><h1>Know every plant.<br /><em>Grow with intent.</em></h1><p>Practical care knowledge for gardens, orchards and fields—organized for the moment you need it.</p></div>
        <div className="library-visual" aria-hidden="true"><span className="library-sun" /><span className="library-leaf one" /><span className="library-leaf two" /><span className="library-stem" /><div className="library-count"><strong>{tips.length}</strong><span>plant guides</span></div></div>
        {user?.isAdmin && <button className="library-add" onClick={() => openEditor()}><FiPlus /> Add guide</button>}
      </section>

      {(successMessage || error) && <div className={`library-notice ${error ? 'error' : 'success'}`}><span>{error || successMessage}</span><button onClick={() => { setError(null); setSuccessMessage(null); }}><FiX /></button></div>}

      <section className="library-toolbar">
        <label className="library-search"><FiSearch /><input type="search" placeholder="Search plants, diseases or care…" value={query} onChange={(event) => setQuery(event.target.value)} /><span>{filteredTips.length} results</span></label>
        <div className="category-tabs" aria-label="Filter plant guides by category">
          {categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{displayType(item)}</button>)}
        </div>
      </section>

      {filteredTips.length === 0 ? (
        <div className="library-empty"><FiBookOpen /><h2>No guide matches that search.</h2><p>Try a plant name, category, symptom or disease.</p><button onClick={() => { setQuery(''); setCategory('All'); }}>Reset library</button></div>
      ) : (
        <section className="library-workspace">
          <div className="plant-index">
            <div className="index-heading"><div><span className="eyebrow">Browse the collection</span><h2>{category === 'All' ? 'All plants' : `${displayType(category)}s`}</h2></div><span>{String(filteredTips.length).padStart(2, '0')} guides</span></div>
            <div className="plant-grid">
              {filteredTips.map((tip, index) => {
                const typeClass = (tip.plantType || 'General').toLowerCase().replaceAll(' ', '-');
                return (
                  <button key={tip._id || tip.name} className={`plant-card ${selectedTip?._id === tip._id ? 'selected' : ''} ${typeClass}`} onClick={() => chooseTip(tip)}>
                    <div className="plant-card-art"><span className="catalog-number">{String(index + 1).padStart(2, '0')}</span><span className="catalog-sun" /><span className="catalog-stem" /><span className="catalog-leaf left" /><span className="catalog-leaf right" /></div>
                    <div className="plant-card-copy"><span className="plant-type">{displayType(tip.plantType)}</span><h3>{tip.name}</h3><div><span><FiDroplet /> {tip.watering}</span><span><FiSun /> {tip.sunlight}</span></div><strong>Open field guide <FiArrowRight /></strong></div>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="plant-manual" ref={detailRef} tabIndex="-1">
            {selectedTip && <>
              <div className={`manual-cover ${(selectedTip.plantType || 'General').toLowerCase()}`}>
                <div><span>AGRISATHI FIELD MANUAL</span><strong>NO. {String(filteredTips.indexOf(selectedTip) + 1).padStart(2, '0')}</strong></div>
                <span className="manual-plant"><i className="manual-stem" /><i className="manual-leaf left" /><i className="manual-leaf right" /></span>
                <span className="manual-type">{displayType(selectedTip.plantType)}</span><h2>{selectedTip.name}</h2>
              </div>
              <div className="manual-content">
                <div className="manual-actions"><span><FiCheck /> Practical care guide</span>{user?.isAdmin && <div><button onClick={() => openEditor(selectedTip)}><FiEdit2 /> Edit</button><button className="danger" onClick={() => handleDelete(selectedTip)}><FiTrash2 /></button></div>}</div>
                <div className="manual-vitals"><article><FiDroplet /><span><small>Water rhythm</small><strong>{selectedTip.watering}</strong></span></article><article><FiSun /><span><small>Light requirement</small><strong>{selectedTip.sunlight}</strong></span></article></div>
                <section className="manual-section"><span className="section-index">01</span><div><h3>Watch for</h3><div className="disease-tags">{selectedTip.diseases.split(',').map((item) => <span key={item.trim()}>{item.trim().replace(/\.$/, '')}</span>)}</div></div></section>
                <section className="manual-section remedy"><span className="section-index">02</span><div><h3>Care response</h3><p>{selectedTip.remedies}</p></div></section>
                <p className="manual-note">Observe the whole plant and local growing conditions before treatment. For severe or spreading disease, consult a local agricultural expert.</p>
              </div>
            </>}
          </aside>
        </section>
      )}

      {isEditing && <div className="editor-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) resetForm(); }}><section className="guide-editor" role="dialog" aria-modal="true" aria-labelledby="guide-editor-title"><header><div><span className="eyebrow">Library editor</span><h2 id="guide-editor-title">{currentTip._id ? `Edit ${currentTip.name}` : 'Create a plant guide'}</h2></div><button onClick={resetForm} aria-label="Close editor"><FiX /></button></header><form onSubmit={handleSubmit}><label>Plant name<input name="name" value={currentTip.name} onChange={handleInputChange} required /></label><label>Category<select name="plantType" value={currentTip.plantType} onChange={handleInputChange}>{categoryOrder.slice(1).map((item) => <option key={item} value={item}>{displayType(item)}</option>)}</select></label><label>Watering<textarea name="watering" value={currentTip.watering} onChange={handleInputChange} rows="2" required /></label><label>Sunlight<textarea name="sunlight" value={currentTip.sunlight} onChange={handleInputChange} rows="2" required /></label><label className="wide">Common diseases<textarea name="diseases" value={currentTip.diseases} onChange={handleInputChange} rows="3" required /></label><label className="wide">Care and remedies<textarea name="remedies" value={currentTip.remedies} onChange={handleInputChange} rows="4" required /></label><div className="editor-actions"><button type="button" onClick={resetForm}>Cancel</button><button type="submit" disabled={isLoading}>{isLoading ? 'Saving…' : currentTip._id ? 'Update guide' : 'Publish guide'}</button></div></form></section></div>}
    </div>
  );
}

export default CareTips;
