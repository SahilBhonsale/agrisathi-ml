import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import config from '../config/config';
import '../styles/QuestionDetail.css';

function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questionData, setQuestionData] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editQuestionData, setEditQuestionData] = useState({});
  const [editCommentData, setEditCommentData] = useState('');
  const [stats, setStats] = useState({
    likes: 0,
    dislikes: 0,
    views: 0,
    hasLiked: false,
    hasDisliked: false
  });

  // Fetch question data only once and increment view
  // Reload when the question or signed-in viewer changes.
  useEffect(() => {
    const fetchQuestionData = async () => {
      try {
        const response = await fetch(
          config.getApiUrl(`/api/forum/questions/${id}?incrementView=true`),
          {
            credentials: 'include'
          }
        );

        if (response.ok) {
          const result = await response.json();
          setQuestionData(result.data.question);
          setEditQuestionData({
            title: result.data.question.title,
            content: result.data.question.content,
            category: result.data.question.category,
            tags: result.data.question.tags?.join(', ') || ''
          });
          
          // Properly handle comments with like status
          const processedComments = result.data.comments.map(comment => ({
            ...comment,
            hasLiked: user && comment.likes ? comment.likes.includes(user._id) : false,
            hasDisliked: user && comment.dislikes ? comment.dislikes.includes(user._id) : false
          }));
          setComments(processedComments);
          
          // Set question stats
          setStats({
            likes: result.data.question.likes ? result.data.question.likes.length : 0,
            dislikes: result.data.question.dislikes ? result.data.question.dislikes.length : 0,
            views: result.data.question.views || 0,
            hasLiked: user && result.data.question.likes ? result.data.question.likes.includes(user._id) : false,
            hasDisliked: user && result.data.question.dislikes ? result.data.question.dislikes.includes(user._id) : false
          });
        } else {
          throw new Error('Failed to fetch question');
        }
      } catch (error) {
        console.error('Error fetching question:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuestionData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?._id]);

  // Handle question edit
  const handleEditQuestion = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(
        config.getApiUrl(`/api/forum/questions/${id}`),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            title: editQuestionData.title,
            content: editQuestionData.content,
            category: editQuestionData.category,
            tags: editQuestionData.tags
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        setQuestionData(result.data);
        setEditingQuestion(false);
        alert('Question updated successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update question');
      }
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Failed to update question: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle question delete
  const handleDeleteQuestion = async () => {
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(
        config.getApiUrl(`/api/forum/questions/${id}`),
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (response.ok) {
        alert('Question deleted successfully!');
        navigate('/forum');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question: ' + error.message);
    }
  };

  // Handle comment edit
  const handleEditComment = async (commentId) => {
    setSubmitting(true);

    try {
      const response = await fetch(
        config.getApiUrl(`/api/forum/comments/${commentId}`),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            content: editCommentData
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        setComments(prev => prev.map(comment => 
          comment._id === commentId ? { ...comment, content: result.data.content } : comment
        ));
        setEditingComment(null);
        setEditCommentData('');
        alert('Comment updated successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update comment');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle comment delete
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const response = await fetch(
        config.getApiUrl(`/api/forum/comments/${commentId}`),
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (response.ok) {
        setComments(prev => prev.filter(comment => comment._id !== commentId));
        alert('Comment deleted successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment: ' + error.message);
    }
  };

  // Handle like action for question
  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(
        config.getApiUrl(`/api/forum/questions/${id}/like`),
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      if (response.ok) {
        const result = await response.json();
        setStats(prev => ({
          ...prev,
          likes: result.data.likes,
          dislikes: result.data.dislikes,
          hasLiked: result.data.hasLiked,
          hasDisliked: result.data.hasDisliked
        }));
      } else {
        const errorData = await response.json();
        console.error('Error liking question:', errorData.message);
      }
    } catch (error) {
      console.error('Error liking question:', error);
    }
  };

  // Handle dislike action for question
  const handleDislike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(
        config.getApiUrl(`/api/forum/questions/${id}/dislike`),
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      if (response.ok) {
        const result = await response.json();
        setStats(prev => ({
          ...prev,
          likes: result.data.likes,
          dislikes: result.data.dislikes,
          hasLiked: result.data.hasLiked,
          hasDisliked: result.data.hasDisliked
        }));
      } else {
        const errorData = await response.json();
        console.error('Error disliking question:', errorData.message);
      }
    } catch (error) {
      console.error('Error disliking question:', error);
    }
  };

  // Handle like action for comments
  const handleCommentLike = async (commentId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(
        config.getApiUrl(`/api/forum/comments/${commentId}/like`),
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      if (response.ok) {
        const result = await response.json();
        setComments(prev => prev.map(comment => 
          comment._id === commentId 
            ? {
                ...comment,
                likes: new Array(result.data.likes).fill(null),
                dislikes: new Array(result.data.dislikes).fill(null),
                hasLiked: result.data.hasLiked,
                hasDisliked: result.data.hasDisliked
              }
            : comment
        ));
      } else {
        const errorData = await response.json();
        console.error('Error liking comment:', errorData.message);
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  // Handle dislike action for comments
  const handleCommentDislike = async (commentId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(
        config.getApiUrl(`/api/forum/comments/${commentId}/dislike`),
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      if (response.ok) {
        const result = await response.json();
        setComments(prev => prev.map(comment => 
          comment._id === commentId 
            ? {
                ...comment,
                likes: new Array(result.data.likes).fill(null),
                dislikes: new Array(result.data.dislikes).fill(null),
                hasLiked: result.data.hasLiked,
                hasDisliked: result.data.hasDisliked
              }
            : comment
        ));
      } else {
        const errorData = await response.json();
        console.error('Error disliking comment:', errorData.message);
      }
    } catch (error) {
      console.error('Error disliking comment:', error);
    }
  };

  // Add this debug version of handleMarkAnswer to see what's happening:
  const handleMarkAnswer = async (commentId) => {
    console.log('🔍 handleMarkAnswer called with:', {
      commentId,
      user: user?._id,
      questionAuthor: questionData.author._id,
      isAdmin: user?.isAdmin
    });

    if (!user) {
      console.log(' No user, redirecting to login');
      navigate('/login');
      return;
    }

    // Check if user is question author or admin
    if (!user.isAdmin && questionData.author._id !== user._id) {
      console.log(' Permission denied:', {
        userIsAdmin: user.isAdmin,
        userIdsMatch: questionData.author._id === user._id
      });
      alert('Only the question author or admin can mark answers');
      return;
    }

    if (!window.confirm('Mark this as the accepted answer? This will unmark any previously accepted answer.')) {
      return;
    }

    console.log('🚀 Making API request to mark answer...');

    try {
      const url = config.getApiUrl(`/api/forum/comments/${commentId}/mark-answer`);
      console.log('Request URL:', url);

      const response = await fetch(url, {
        method: 'PATCH',
        credentials: 'include'
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Success response:', result);
        
        // Update all comments - unmark previous answers and mark the new one
        setComments(prev => prev.map(comment => ({
          ...comment,
          isAnswer: comment._id === commentId
        })));
        
        // Update question data to mark as resolved
        setQuestionData(prev => ({
          ...prev,
          isResolved: true
        }));

        alert('Answer accepted successfully!');
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        alert('Error: ' + (errorData.message || 'Failed to mark answer'));
      }
    } catch (error) {
      console.error('Network/Parse error:', error);
      alert('Failed to mark as answer. Please check console for details.');
    }
  };

  // Handle comment submission
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        config.getApiUrl(`/api/forum/questions/${id}/comments`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ content: newComment.trim() })
        }
      );

      if (response.ok) {
        const result = await response.json();
        setComments(prev => [...prev, {
          ...result.data,
          hasLiked: false,
          hasDisliked: false,
          likes: [],
          dislikes: []
        }]);
        setNewComment('');
        alert('Comment added successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
  'All', 'General', 'Crop Care', 'Pest Control', 'Irrigation', 'Soil Health', 
  'Weather', 'Seeds', 'Harvesting', 'Marketing', 'Equipment', 'Technology'];

  const getCategoryIcon = (category) => {
  const icons = {
    'General': '',
    'Crop Care': '',
    'Pest Control': '',
    'Irrigation': '',
    'Soil Health': '',
    'Weather': '',
    'Seeds': '',
    'Harvesting': '',
    'Marketing': '',
    'Equipment': '',
    'Technology': ''
  };
  return icons[category] || '';
};

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="question-detail-container">
        <div className="loading">🔄 Loading question...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error"> {error}</div>
        <button onClick={() => navigate('/forum')} className="back-btn">
          ← Back to Forum
        </button>
      </div>
    );
  }

  if (!questionData) {
    return (
      <div className="error-container">
        <div className="error"> Question not found</div>
        <button onClick={() => navigate('/forum')} className="back-btn">
          ← Back to Forum
        </button>
      </div>
    );
  }

  // Sort comments to show accepted answer first
  const sortedComments = [...comments].sort((a, b) => {
    if (a.isAnswer && !b.isAnswer) return -1;
    if (!a.isAnswer && b.isAnswer) return 1;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const hasAcceptedAnswer = comments.some(comment => comment.isAnswer);

  return (
    <div className="question-detail-container">
      {/* Navigation & Breadcrumb */}
      <div className="navigation">
        <div className="breadcrumb">
          <button onClick={() => navigate('/forum')} className="breadcrumb-link">
             Community Forum
          </button>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">
            {getCategoryIcon(questionData.category)} {questionData.category}
          </span>
        </div>
        <button onClick={() => navigate('/forum')} className="back-btn">
          ← Back to Forum
        </button>
      </div>

      {/* Question Status Banner */}
      {hasAcceptedAnswer && (
        <div className="status-banner resolved">
          <div className="status-content">
            <span className="status-icon"></span>
            <div className="status-text">
              <strong>Question Resolved</strong>
              <p>This question has an accepted answer</p>
            </div>
          </div>
        </div>
      )}

      {/* Question */}
      <div className="question-card">
        {editingQuestion ? (
          // Edit Question Form
          <form onSubmit={handleEditQuestion} className="edit-question-form">
            <div className="form-group">
              <label>Question Title</label>
              <input
                type="text"
                value={editQuestionData.title}
                onChange={(e) => setEditQuestionData(prev => ({ ...prev, title: e.target.value }))}
                required
                className="form-input"
                maxLength={200}
              />
            </div>
            
            <div className="form-group">
              <label>Category</label>
              <select
                value={editQuestionData.category}
                onChange={(e) => setEditQuestionData(prev => ({ ...prev, category: e.target.value }))}
                className="form-select"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{getCategoryIcon(cat)} {cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Content</label>
              <textarea
                value={editQuestionData.content}
                onChange={(e) => setEditQuestionData(prev => ({ ...prev, content: e.target.value }))}
                required
                rows={6}
                className="form-textarea"
                maxLength={2000}
              />
            </div>

            <div className="form-group">
              <label>Tags (comma separated)</label>
              <input
                type="text"
                value={editQuestionData.tags}
                onChange={(e) => setEditQuestionData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="tag1, tag2, tag3"
                className="form-input"
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setEditingQuestion(false)} className="cancel-btn">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="save-btn">
                {submitting ? 'Saving...' : ' Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          // Display Question
          <>
            <div className="question-header">
              <div className="question-title-row">
                <h1 className="question-title">{questionData.title}</h1>
                {questionData.isPinned && (
                  <span className="pin-badge">Pinned</span>
                )}
              </div>
              
              <div className="question-meta">
                <div className="meta-left">
                  <span className="category-badge">
                    {getCategoryIcon(questionData.category)} {questionData.category}
                  </span>
                  <span className="author-info">
                    <span className="author-avatar"></span>
                    <span className="author-name">
                      {questionData.author?.name}
                      {questionData.author?.isAdmin && (
                        <span className="admin-badge">Admin</span>
                      )}
                    </span>
                  </span>
                </div>
                
                <div className="meta-right">
                  <span className="question-date" title={new Date(questionData.createdAt).toLocaleString()}>
                     {formatTimeAgo(questionData.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="question-content">
              <div className="content-text">
                {questionData.content.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            {questionData.tags && questionData.tags.length > 0 && (
              <div className="question-tags">
                {questionData.tags.map((tag, index) => (
                  <span key={index} className="tag">#{tag}</span>
                ))}
              </div>
            )}

            <div className="question-actions">
              <div className="voting-section">
                <button 
                  className={`vote-btn like ${stats.hasLiked ? 'active' : ''}`}
                  onClick={handleLike}
                  disabled={!user}
                  title={!user ? 'Login to vote' : stats.hasLiked ? 'Remove like' : 'Like this question'}
                >
                  <span className="vote-icon">Likes</span>
                  <span className="vote-count">{stats.likes}</span>
                </button>
                
                <button 
                  className={`vote-btn dislike ${stats.hasDisliked ? 'active' : ''}`}
                  onClick={handleDislike}
                  disabled={!user}
                  title={!user ? 'Login to vote' : stats.hasDisliked ? 'Remove dislike' : 'Dislike this question'}
                >
                  <span className="vote-icon">Dislikes</span>
                  <span className="vote-count">{stats.dislikes}</span>
                </button>
              </div>

              <div className="question-stats">
                {/* <div className="stat-item">
                  <span className="stat-icon"></span>
                  <span className="stat-value">{stats.views}</span>
                  <span className="stat-label">views</span>
                </div> */}
                <div className="stat-item">
                  <span className="stat-icon"></span>
                  <span className="stat-value">{comments.length}</span>
                  <span className="stat-label">answers</span>
                </div>
                {hasAcceptedAnswer && (
                  <div className="stat-item solved">
                    <span className="stat-icon"></span>
                    <span className="stat-label">Solved</span>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Controls for Question */}
            {user?.isAdmin && (
              <div className="admin-controls">
                <div className="admin-badge-header">
                  <span className="admin-crown"></span>
                  <span>Admin Controls</span>
                </div>
                <div className="admin-actions">
                  <button 
                    onClick={() => setEditingQuestion(true)}
                    className="admin-edit-btn"
                    title="Edit this question"
                  >
                     Edit Question
                  </button>
                  <button 
                    onClick={handleDeleteQuestion}
                    className="admin-delete-btn"
                    title="Delete this question"
                  >
                     Delete Question
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Comments Section */}
      <div className="comments-section">
        <div className="comments-header">
          <h3 className="comments-title">
             {comments.length} {comments.length === 1 ? 'Answer' : 'Answers'}
          </h3>
          {!hasAcceptedAnswer && comments.length > 0 && (
            <div className="help-note">
              <span className="help-icon"></span>
              <span>Vote for helpful answers</span>
            </div>
          )}
        </div>
        
        {/* Add Comment Form */}
        {user ? (
          <form onSubmit={handleSubmitComment} className="comment-form">
            <div className="form-header">
              <h4>Your Answer</h4>
              <p>Share your knowledge and help the community</p>
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Provide a helpful answer with specific details, steps, or solutions..."
              required
              rows={4}
              disabled={submitting}
              className="comment-textarea"
              maxLength={1000}
            />
            <div className="form-footer">
              <div className="char-count">
                {newComment.length}/1000 characters
              </div>
              <button 
                type="submit" 
                disabled={submitting || !newComment.trim()}
                className="submit-comment-btn"
              >
                {submitting ? 'Posting...' : 'Post Answer'}
              </button>
            </div>
          </form>
        ) : (
          <div className="login-prompt">
            <div className="prompt-content">
              <span className="prompt-icon"></span>
              <div className="prompt-text">
                <h4>Want to help?</h4>
                <p>Please <button onClick={() => navigate('/login')} className="login-link">sign in</button> to post an answer.</p>
              </div>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="comments-list">
          {sortedComments.length === 0 ? (
            <div className="no-comments">
              <div className="no-comments-content">
                <span className="no-comments-icon"></span>
                <h4>No answers yet</h4>
                <p>Be the first to help by sharing your knowledge!</p>
              </div>
            </div>
          ) : (
            sortedComments.map((comment, index) => (
              <div key={comment._id} className={`comment ${comment.isAnswer ? 'accepted-answer' : ''}`}>
                {comment.isAnswer && (
                  <div className="answer-badge">
                    <span className="badge-icon"></span>
                    <span className="badge-text">Accepted Answer</span>
                  </div>
                )}
                
                <div className="comment-header">
                  <div className="comment-author-info">
                    <span className="author-avatar">👤</span>
                    <div className="author-details">
                      <span className="author-name">
                        {comment.author?.name}
                        {comment.author?.isAdmin && (
                          <span className="admin-badge"> Admin</span>
                        )}
                      </span>
                      <span className="comment-date" title={new Date(comment.createdAt).toLocaleString()}>
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  {index === 0 && !comment.isAnswer && comments.length > 0 && (
                    <div className="first-answer-badge">
                      <span> First to answer</span>
                    </div>
                  )}
                </div>
                
                {editingComment === comment._id ? (
                  // Edit Comment Form
                  <div className="edit-comment-form">
                    <textarea
                      value={editCommentData}
                      onChange={(e) => setEditCommentData(e.target.value)}
                      rows={4}
                      className="form-textarea"
                      maxLength={1000}
                    />
                    <div className="form-actions">
                      <button 
                        onClick={() => {
                          setEditingComment(null);
                          setEditCommentData('');
                        }}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleEditComment(comment._id)}
                        disabled={submitting}
                        className="save-btn"
                      >
                        {submitting ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display Comment
                  <div className="comment-content">
                    <div className="content-text">
                      {comment.content.split('\n').map((paragraph, pIndex) => (
                        <p key={pIndex}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="comment-actions">
                  <div className="comment-voting">
                    <button 
                      className={`vote-btn like ${comment.hasLiked ? 'active' : ''}`}
                      onClick={() => handleCommentLike(comment._id)}
                      disabled={!user}
                      title={!user ? 'Login to vote' : comment.hasLiked ? 'Remove like' : 'Like this answer'}
                    >
                      <span className="vote-icon">Like</span>
                      <span className="vote-count">{comment.likes?.length || 0}</span>
                    </button>
                    <button 
                      className={`vote-btn dislike ${comment.hasDisliked ? 'active' : ''}`}
                      onClick={() => handleCommentDislike(comment._id)}
                      disabled={!user}
                      title={!user ? 'Login to vote' : comment.hasDisliked ? 'Remove dislike' : 'Dislike this answer'}
                    >
                      <span className="vote-icon">Dislike</span>
                      <span className="vote-count">{comment.dislikes?.length || 0}</span>
                    </button>
                  </div>

                  <div className="comment-controls">
                    {/* Mark as Answer (Question Author or Admin) */}
                    {user && (questionData.author._id === user._id || user.isAdmin) && !comment.isAnswer && !hasAcceptedAnswer && (
                      <button 
                        className="mark-answer-btn"
                        onClick={() => handleMarkAnswer(comment._id)}  title="Mark this as the accepted answer">
                        <span className="btn-icon"></span>
                        <span className="btn-text">Accept Answer</span>
                      </button>
                    )}

                    {/* Admin Controls for Comments */}
                    {user?.isAdmin && (
                      <div className="admin-comment-controls">
                        <span className="admin-label"> Admin:</span>
                        <button 
                          onClick={() => {
                            setEditingComment(comment._id);
                            setEditCommentData(comment.content);
                          }}
                          className="admin-edit-btn"
                          title="Edit this answer"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteComment(comment._id)}
                          className="admin-delete-btn"
                          title="Delete this answer"
                        >
                           Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Related Questions Suggestion */}
      <div className="related-section">
        <h4> Related Questions</h4>
        <p>
          Looking for more help? 
          <button onClick={() => navigate('/forum')} className="browse-link">
            Browse similar questions
          </button>
          or 
          <button onClick={() => navigate('/forum/ask')} className="ask-link">
            ask a new question
          </button>
        </p>
      </div>
    </div>
  );
}

export default QuestionDetail;
