import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import config from '../config/config';
import '../styles/AskQuestion.css';

function AskQuestion() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const categories = [
    'General', 'Crop Management', 'Pest Control', 'Soil Health', 
    'Weather', 'Market', 'Technology', 'Seeds', 'Fertilizers', 
    'Irrigation', 'Harvesting', 'Organic Farming'
  ];

  const popularTags = [
    'wheat', 'rice', 'tomato', 'organic', 'fertilizer', 'pesticide',
    'drought', 'irrigation', 'soil-health', 'seeds', 'harvest',
    'market-price', 'technology', 'climate', 'disease', 'insects'
  ];

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagClick = (tag) => {
    const currentTags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag].join(', ');
      setFormData(prev => ({
        ...prev,
        tags: newTags
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    if (formData.title.length < 10) {
      setError('Title must be at least 10 characters long');
      return;
    }

    if (formData.content.length < 20) {
      setError('Content must be at least 20 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(config.getApiUrl('/api/forum/questions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
          category: formData.category,
          tags: formData.tags.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Redirect to the new question
        navigate(`/forum/question/${result.data._id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create question');
      }
    } catch (error) {
      console.error('Error creating question:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'General': '',
      'Crop Management': '',
      'Pest Control': '',
      'Soil Health': '',
      'Weather': '',
      'Market': '',
      'Technology': '',
      'Seeds': '',
      'Fertilizers': '',
      'Irrigation': '',
      'Harvesting': '',
      'Organic Farming': ''
    };
    return icons[category] || '';
  };

  if (!user) {
    return (
      <div className="ask-question-container">
        <div className="loading"> Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="ask-question-container">
      {/* Header */}
      <div className="ask-header">
        <h1>Ask a Question</h1>
        <p>Share your farming challenges and get help from the community</p>
      </div>

      Guidelines
      <div className="guidelines">
        <h3> Posting Guidelines</h3>
        <ul>
          <li> Be specific and clear in your question</li>
          <li> Include relevant details about your crop, location, and problem</li>
          <li> Add tags to help others find your question</li>
          <li> Be respectful and helpful to fellow farmers</li>
          <li> Search existing questions before posting duplicates</li>
        </ul>
      </div>

      {/* Form */}
      <div className="question-form-container">
        <form onSubmit={handleSubmit} className="question-form">
          {/* Title */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
               Question Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="What's your farming question? Be specific..."
              required
              maxLength={200}
              className="form-input"
            />
            <div className="char-count">
              {formData.title.length}/200 characters
            </div>
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="category" className="form-label">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="form-select"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {getCategoryIcon(cat)} {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div className="form-group">
            <label htmlFor="content" className="form-label">
               Detailed Description *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Provide detailed information about your question:
• What crop are you growing?
• What specific problem are you facing?
• What have you already tried?
• What's your location/climate?
• Any other relevant details..."
              required
              rows={8}
              maxLength={2000}
              className="form-textarea"
            />
            <div className="char-count">
              {formData.content.length}/2000 characters
            </div>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label htmlFor="tags" className="form-label">
               Tags (Optional)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="Add tags separated by commas (e.g., wheat, pest-control, organic)"
              className="form-input"
            />
            
            {/* Popular Tags */}
            <div className="popular-tags">
              <span className="tags-label">Popular tags:</span>
              <div className="tags-list">
                {popularTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className="tag-button"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message">
               {error}
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/forum')}
              className="cancel-btn"
              disabled={loading}
            >
              ← Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.content.trim()}
              className="submit-btn"
            >
              {loading ? ' Posting Question...' : ' Post Question'}
            </button>
          </div>
        </form>
      </div>
      {/* Tips */}
      <div className="tips-sidebar">
        <h3> Tips for Good Questions</h3>
        <div className="tip">
          <h4> Be Specific</h4>
          <p>Instead of "My plants are dying", write "My tomato plants have yellow leaves with brown spots"</p>
        </div>
        
        <div className="tip">
          <h4> Include Location</h4>
          <p>Mention your region/climate as farming advice varies by location</p>
        </div>
        
        <div className="tip">
          <h4> Add Context</h4>
          <p>Describe what you've already tried and when the problem started</p>
        </div>
        
        <div className="tip">
          <h4> Use Tags</h4>
          <p>Add relevant tags to help others find and answer your question</p>
        </div>
      </div>
    </div>
  );
}

export default AskQuestion;
