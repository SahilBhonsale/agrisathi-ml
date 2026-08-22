import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiArrowDown, FiArrowRight, FiArrowUp, FiCheckCircle, FiEye, FiHash, FiMessageCircle, FiPlus, FiSearch, FiTrendingUp, FiUsers } from 'react-icons/fi';
import config from '../config/config';
import '../styles/CommunityForum.css';

const categories = ['All', 'General', 'Crop Management', 'Pest Control', 'Soil Health', 'Weather', 'Market', 'Technology', 'Seeds', 'Fertilizers', 'Irrigation', 'Harvesting', 'Organic Farming'];
const quickTopics = ['All', 'Crop Management', 'Pest Control', 'Soil Health', 'Irrigation', 'Organic Farming'];

function CommunityForum() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appliedSearch, setAppliedSearch] = useState('');
  const [filters, setFilters] = useState({ category: 'All', search: '', sortBy: 'createdAt', sortOrder: 'desc' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        category: filters.category !== 'All' ? filters.category : '',
        search: appliedSearch,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      [...params].forEach(([key, value]) => { if (!value) params.delete(key); });
      const response = await fetch(config.getApiUrl(`/api/forum/questions?${params}`), { credentials: 'include' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch questions');
      }
      const data = await response.json();
      setQuestions(data.data.map((question) => ({
        ...question,
        hasLiked: Boolean(user && question.likes?.includes(user._id)),
        hasDisliked: Boolean(user && question.dislikes?.includes(user._id)),
        likesCount: question.likes?.length || 0,
        dislikesCount: question.dislikes?.length || 0
      })));
      setPagination((previous) => ({ ...previous, total: data.pagination.total, pages: data.pagination.pages }));
    } catch (requestError) {
      console.error('Error fetching questions:', requestError);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  // Query state is intentionally the trigger for loading forum data.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.sortBy, filters.sortOrder, appliedSearch, pagination.page, user?._id]);

  const trendingTags = useMemo(() => {
    const counts = questions.reduce((tagCounts, question) => {
      (question.tags || []).forEach((tag) => {
        const normalizedTag = tag.toLowerCase();
        tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
      });
      return tagCounts;
    }, {});
    return Object.entries(counts).sort((first, second) => second[1] - first[1]).slice(0, 6);
  }, [questions]);

  const pageStats = useMemo(() => questions.reduce((stats, question) => ({
    views: stats.views + (question.views || 0),
    replies: stats.replies + (question.commentCount || 0)
  }), { views: 0, replies: 0 }), [questions]);

  const handleSearch = (event) => {
    event.preventDefault();
    const nextSearch = filters.search.trim();
    setPagination((previous) => ({ ...previous, page: 1 }));
    setAppliedSearch(nextSearch);
    if (nextSearch === appliedSearch && pagination.page === 1) fetchQuestions();
  };

  const handleFilterChange = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    if (key !== 'search') setPagination((previous) => ({ ...previous, page: 1 }));
  };

  const clearSearch = () => {
    setFilters((previous) => ({ ...previous, search: '' }));
    setAppliedSearch('');
    setPagination((previous) => ({ ...previous, page: 1 }));
  };

  const handleVote = async (questionId, voteType, event) => {
    event.preventDefault();
    if (!user) { navigate('/login'); return; }
    try {
      const response = await fetch(config.getApiUrl(`/api/forum/questions/${questionId}/${voteType}`), { method: 'POST', credentials: 'include' });
      if (!response.ok) return;
      const result = await response.json();
      setQuestions((previous) => previous.map((question) => question._id === questionId ? {
        ...question,
        hasLiked: result.data.hasLiked,
        hasDisliked: result.data.hasDisliked,
        likesCount: result.data.likes,
        dislikesCount: result.data.dislikes
      } : question));
    } catch (voteError) {
      console.error(`Error registering ${voteType}:`, voteError);
    }
  };

  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getInitials = (name = 'Farmer') => name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  if (loading && questions.length === 0) {
    return <div className="forum-container page-shell"><div className="loading-state"><div><div className="spinner" /><p>Gathering field conversations…</p></div></div></div>;
  }

  return (
    <div className="forum-container page-shell">
      <section className="community-hero">
        <div className="community-hero-copy">
          <span className="eyebrow">The growers&apos; circle</span>
          <h1>Knowledge grows<br /><em>when shared.</em></h1>
          <p>Real questions. Practical field experience. A community helping every grower make the next decision with confidence.</p>
          <div className="community-hero-actions">
            <Link to={user ? '/forum/ask' : '/login'} className="community-primary-action"><FiPlus /> {user ? 'Ask the community' : 'Join the community'}</Link>
            <span><FiUsers /> {pagination.total || 'New'} field discussions</span>
          </div>
        </div>
        <div className="community-visual" aria-hidden="true">
          <div className="community-orbit orbit-one" /><div className="community-orbit orbit-two" />
          <div className="community-avatar avatar-one">AS</div><div className="community-avatar avatar-two">RK</div>
          <div className="community-avatar avatar-three">MP</div><div className="community-avatar avatar-four">NJ</div>
          <div className="community-speech speech-one"><span /><span /><span /></div>
          <div className="community-speech speech-two"><FiTrendingUp /></div><div className="community-field-lines" />
        </div>
      </section>

      <section className="community-toolbar" aria-label="Discussion filters">
        <form onSubmit={handleSearch} className="community-search">
          <FiSearch />
          <input type="search" placeholder="Search crops, problems or field advice…" value={filters.search} onChange={(event) => handleFilterChange('search', event.target.value)} aria-label="Search community questions" />
          {filters.search && <button type="button" onClick={clearSearch} className="community-search-clear" aria-label="Clear search">×</button>}
          <button type="submit" disabled={loading}>{loading ? 'Finding…' : 'Find answers'}</button>
        </form>
        <div className="community-filter-selects">
          <label><span>Topic</span><select value={filters.category} onChange={(event) => handleFilterChange('category', event.target.value)}>{categories.map((category) => <option key={category} value={category}>{category === 'All' ? 'Every topic' : category}</option>)}</select></label>
          <label><span>Order</span><select value={`${filters.sortBy}-${filters.sortOrder}`} onChange={(event) => { const [sortBy, sortOrder] = event.target.value.split('-'); setFilters((previous) => ({ ...previous, sortBy, sortOrder })); setPagination((previous) => ({ ...previous, page: 1 })); }}>
            <option value="createdAt-desc">Freshly asked</option><option value="createdAt-asc">Oldest first</option><option value="views-desc">Most viewed</option><option value="likes-desc">Most useful</option>
          </select></label>
        </div>
      </section>

      <nav className="community-topic-rail" aria-label="Popular community topics">
        <span><FiHash /> Browse</span><div>{quickTopics.map((topic) => <button key={topic} type="button" className={filters.category === topic ? 'active' : ''} onClick={() => handleFilterChange('category', topic)}>{topic === 'All' ? 'All conversations' : topic}</button>)}</div>
      </nav>

      {appliedSearch && <div className="community-search-result"><FiSearch /><span>Showing {pagination.total} result{pagination.total === 1 ? '' : 's'} for <strong>“{appliedSearch}”</strong></span><button type="button" onClick={clearSearch}>Reset search</button></div>}
      {error && <div className="community-error"><span>{error}</span><button onClick={fetchQuestions}>Try again</button></div>}

      <div className="community-workspace">
        <main className="discussion-feed">
          <header className="feed-heading"><div><span className="eyebrow">From the field</span><h2>{filters.category === 'All' ? 'Latest conversations' : filters.category}</h2></div><span>{pagination.total} discussion{pagination.total === 1 ? '' : 's'}</span></header>
          <div className="discussion-list" aria-busy={loading}>
            {questions.length === 0 && !loading ? (
              <div className="community-empty"><FiUsers /><h3>No conversations here yet</h3><p>{appliedSearch ? 'Try a broader crop name or clear the search.' : 'Start this field note and let the community contribute.'}</p><Link to={user ? '/forum/ask' : '/login'}><FiPlus /> Start a discussion</Link></div>
            ) : questions.map((question, index) => {
              const authorName = question.author?.name || 'AgriSathi grower';
              return (
                <article key={question._id} className={`discussion-card ${index === 0 ? 'lead-discussion' : ''} ${question.isPinned ? 'pinned' : ''}`}>
                  <div className="discussion-vote-rail">
                    <button className={question.hasLiked ? 'active' : ''} onClick={(event) => handleVote(question._id, 'like', event)} title={!user ? 'Login to vote' : 'This was useful'} aria-label="Upvote question"><FiArrowUp /></button>
                    <strong>{question.likesCount - question.dislikesCount}</strong>
                    <button className={question.hasDisliked ? 'active down' : ''} onClick={(event) => handleVote(question._id, 'dislike', event)} title={!user ? 'Login to vote' : 'This was not useful'} aria-label="Downvote question"><FiArrowDown /></button><small>useful</small>
                  </div>
                  <div className="discussion-body">
                    <div className="discussion-author-row">
                      <div className="discussion-avatar" style={{ '--avatar-tone': `${42 + (index * 29) % 115}` }}>{getInitials(authorName)}</div>
                      <div><strong>{authorName}</strong><span>{formatRelativeDate(question.createdAt)} · {question.author?.isAdmin ? 'Community guide' : 'Field question'}</span></div>
                      <div className="discussion-badges">{question.isPinned && <span className="pin-badge">Editor&apos;s pick</span>}{question.isResolved && <span className="resolved-badge"><FiCheckCircle /> Answered</span>}<span className="category-badge">{question.category}</span></div>
                    </div>
                    <Link to={`/forum/question/${question._id}`} className="discussion-title">{question.title}</Link>
                    <p className="discussion-preview">{question.content.substring(0, 240)}{question.content.length > 240 && '…'}</p>
                    <div className="discussion-card-footer">
                      <div className="discussion-tags">{(question.tags || []).slice(0, 4).map((tag) => <span key={tag}>#{tag}</span>)}</div>
                      <div className="discussion-signals"><span><FiMessageCircle /> {question.commentCount || 0} replies</span><span><FiEye /> {question.views || 0} views</span><Link to={`/forum/question/${question._id}`}>Join discussion <FiArrowRight /></Link></div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {pagination.pages > 1 && <div className="community-pagination"><button onClick={() => setPagination((previous) => ({ ...previous, page: previous.page - 1 }))} disabled={pagination.page === 1 || loading}>← Newer</button><span><strong>{pagination.page}</strong> / {pagination.pages}</span><button onClick={() => setPagination((previous) => ({ ...previous, page: previous.page + 1 }))} disabled={pagination.page === pagination.pages || loading}>Older →</button></div>}
        </main>

        <aside className="community-sidebar">
          <section className="pulse-card"><div className="pulse-heading"><span><i /> Live community</span><FiTrendingUp /></div><h3>Community pulse</h3><p>Useful knowledge moving between fields right now.</p><div className="pulse-stats"><div><strong>{pagination.total}</strong><span>Questions</span></div><div><strong>{pageStats.views}</strong><span>Reads</span></div><div><strong>{pageStats.replies}</strong><span>Replies</span></div></div></section>
          <section className="trending-card"><div className="sidebar-title"><FiHash /><span>Trending in the fields</span></div><div className="trending-list">{trendingTags.length > 0 ? trendingTags.map(([tag, count], index) => <button type="button" key={tag} onClick={() => { setFilters((previous) => ({ ...previous, search: tag })); setAppliedSearch(tag); setPagination((previous) => ({ ...previous, page: 1 })); }}><span><small>{String(index + 1).padStart(2, '0')}</small> #{tag}</span><strong>{count} post{count === 1 ? '' : 's'}</strong></button>) : <p>Topics will appear as growers begin sharing.</p>}</div></section>
          <section className="ask-card"><span className="eyebrow">Your field. Your question.</span><h3>Someone here has faced it before.</h3><p>Share a clear photo, crop stage and what you have already tried for more useful answers.</p><Link to={user ? '/forum/ask' : '/login'}>{user ? 'Ask the growers' : 'Sign in to ask'} <FiArrowRight /></Link></section>
        </aside>
      </div>
    </div>
  );
}

export default CommunityForum;
