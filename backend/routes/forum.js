const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Comment = require('../models/Comment');
const { authenticate } = require('../middleware/auth');

// Test route to check if forum routes are working
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Forum routes are working!',
    timestamp: new Date()
  });
});

// GET /api/forum/questions - Get all questions with pagination
router.get('/questions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const search = req.query.search;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    let filter = { isDeleted: false };
    
    if (category && category !== 'All') {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const questions = await Question.find(filter)
      .populate('author', 'name email isAdmin')
      .sort({ isPinned: -1, [sortBy]: sortOrder })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Question.countDocuments(filter);

    res.json({
      success: true,
      data: questions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions'
    });
  }
});

// POST /api/forum/questions - Create new question
router.post('/questions', authenticate, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    console.log('📝 Creating new question:', { title, content, category, tags });
    console.log('🔐 User authenticated:', req.user ? req.user.name : 'No user');

    if (!title || !content) {
      console.log('❌ Missing required fields:', { title: !!title, content: !!content });
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    if (!req.user) {
      console.log('❌ No authenticated user found');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const question = new Question({
      title,
      content,
      category: category || 'General',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      author: req.user._id
    });

    console.log('💾 Saving question to database...');
    await question.save();
    await question.populate('author', 'name email');

    console.log('✅ Question created successfully:', question._id);

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: question
    });
  } catch (error) {
    console.error('❌ Error creating question:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/forum/questions/:id - Get single question with comments
router.get('/questions/:id', async (req, res) => {
  try {
    const incrementView = req.query.incrementView === 'true';
    
    const question = await Question.findById(req.params.id)
      .populate('author', 'name email isAdmin');

    if (!question || question.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Only increment view count if explicitly requested (actual page visit)
    if (incrementView) {
      question.views += 1;
      await question.save();
    }

    // Get comments for this question
    const comments = await Comment.find({ 
      question: req.params.id, 
      isDeleted: false 
    })
    .populate('author', 'name email isAdmin')
    .sort({ isAnswer: -1, createdAt: 1 });

    res.json({
      success: true,
      data: {
        question,
        comments
      }
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question'
    });
  }
});

// GET /api/forum/questions/:id/stats - Get question stats without incrementing views
router.get('/questions/:id/stats', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .select('likes dislikes views commentCount')
      .lean();

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      data: {
        likes: question.likes.length,
        dislikes: question.dislikes.length,
        views: question.views,
        commentCount: question.commentCount,
        hasLiked: question.likes.includes(req.user?._id),
        hasDisliked: question.dislikes.includes(req.user?._id)
      }
    });
  } catch (error) {
    console.error('Error fetching question stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question stats'
    });
  }
});

// POST /api/forum/questions/:id/comments - Add comment to question
router.post('/questions/:id/comments', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const questionId = req.params.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question || question.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const comment = new Comment({
      content,
      question: questionId,
      author: req.user._id
    });

    await comment.save();
    await comment.populate('author', 'name email isAdmin');

    // Update question's comment count
    await Question.findByIdAndUpdate(questionId, {
      $inc: { commentCount: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment'
    });
  }
});

// POST /api/forum/questions/:id/like - Like/Unlike a question
router.post('/questions/:id/like', authenticate, async (req, res) => {
  try {
    const questionId = req.params.id;
    const userId = req.user._id;

    const question = await Question.findById(questionId);
    if (!question || question.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const hasLiked = question.likes.includes(userId);
    const hasDisliked = question.dislikes.includes(userId);

    if (hasLiked) {
      // Remove like
      question.likes.pull(userId);
    } else {
      // Add like and remove dislike if exists
      question.likes.push(userId);
      if (hasDisliked) {
        question.dislikes.pull(userId);
      }
    }

    await question.save();

    // Return updated stats without full question data
    res.json({
      success: true,
      message: hasLiked ? 'Like removed' : 'Question liked',
      data: {
        likes: question.likes.length,
        dislikes: question.dislikes.length,
        views: question.views, // Don't increment here
        hasLiked: !hasLiked,
        hasDisliked: false
      }
    });
  } catch (error) {
    console.error('Error liking question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like question'
    });
  }
});

// POST /api/forum/questions/:id/dislike - Dislike/Undislike a question
router.post('/questions/:id/dislike', authenticate, async (req, res) => {
  try {
    const questionId = req.params.id;
    const userId = req.user._id;

    const question = await Question.findById(questionId);
    if (!question || question.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const hasLiked = question.likes.includes(userId);
    const hasDisliked = question.dislikes.includes(userId);

    if (hasDisliked) {
      // Remove dislike
      question.dislikes.pull(userId);
    } else {
      // Add dislike and remove like if exists
      question.dislikes.push(userId);
      if (hasLiked) {
        question.likes.pull(userId);
      }
    }

    await question.save();

    // Return updated stats without full question data
    res.json({
      success: true,
      message: hasDisliked ? 'Dislike removed' : 'Question disliked',
      data: {
        likes: question.likes.length,
        dislikes: question.dislikes.length,
        views: question.views, // Don't increment here
        hasLiked: false,
        hasDisliked: !hasDisliked
      }
    });
  } catch (error) {
    console.error('Error disliking question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dislike question'
    });
  }
});

// POST /api/forum/comments/:id/like - Like/Unlike a comment
router.post('/comments/:id/like', authenticate, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const hasLiked = comment.likes.includes(userId);
    const hasDisliked = comment.dislikes.includes(userId);

    if (hasLiked) {
      comment.likes.pull(userId);
    } else {
      comment.likes.push(userId);
      if (hasDisliked) {
        comment.dislikes.pull(userId);
      }
    }

    await comment.save();

    res.json({
      success: true,
      message: hasLiked ? 'Like removed' : 'Comment liked',
      data: {
        likes: comment.likes.length,
        dislikes: comment.dislikes.length,
        hasLiked: !hasLiked,
        hasDisliked: false
      }
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like comment'
    });
  }
});

// POST /api/forum/comments/:id/dislike - Dislike/Undislike a comment
router.post('/comments/:id/dislike', authenticate, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const hasLiked = comment.likes.includes(userId);
    const hasDisliked = comment.dislikes.includes(userId);

    if (hasDisliked) {
      comment.dislikes.pull(userId);
    } else {
      comment.dislikes.push(userId);
      if (hasLiked) {
        comment.likes.pull(userId);
      }
    }

    await comment.save();

    res.json({
      success: true,
      message: hasDisliked ? 'Dislike removed' : 'Comment disliked',
      data: {
        likes: comment.likes.length,
        dislikes: comment.dislikes.length,
        hasLiked: false,
        hasDisliked: !hasDisliked
      }
    });
  } catch (error) {
    console.error('Error disliking comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dislike comment'
    });
  }
});

// PATCH /api/forum/comments/:id/mark-answer - Mark comment as answer (question author only)
router.patch('/comments/:id/mark-answer', authenticate, async (req, res) => {
  try {
    const commentId = req.params.id;
    
    const comment = await Comment.findById(commentId).populate('question');
    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const question = await Question.findById(comment.question._id);
    if (!question || question.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check if user is question author or admin
    if (!req.user.isAdmin && !question.author.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the question author or admin can mark answers'
      });
    }

    // Unmark any existing accepted answers for this question
    await Comment.updateMany(
      { question: question._id },
      { isAnswer: false }
    );

    // Mark this comment as the accepted answer
    comment.isAnswer = true;
    await comment.save();

    // Update question to mark as resolved
    question.isResolved = true;
    await question.save();

    res.json({
      success: true,
      message: 'Comment marked as accepted answer',
      data: {
        commentId: comment._id,
        isAnswer: true,
        questionResolved: true
      }
    });
  } catch (error) {
    console.error('Error marking answer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark answer'
    });
  }
});

// PUT /api/forum/questions/:id - Update question (Admin or Author)
router.put('/questions/:id', authenticate, async (req, res) => {
  try {
    const questionId = req.params.id;
    const { title, content, category, tags } = req.body;

    const question = await Question.findById(questionId);
    if (!question || question.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check if user is admin or question author
    if (!req.user.isAdmin && !question.author.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this question'
      });
    }

    // Update question
    question.title = title || question.title;
    question.content = content || question.content;
    question.category = category || question.category;
    question.tags = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : question.tags;

    await question.save();
    await question.populate('author', 'name email isAdmin');

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question'
    });
  }
});

// DELETE /api/forum/questions/:id - Delete question (Admin only)
router.delete('/questions/:id', authenticate, async (req, res) => {
  try {
    const questionId = req.params.id;

    // Only admins can delete questions
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required to delete questions'
      });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Soft delete
    question.isDeleted = true;
    question.deletedAt = new Date();
    question.deletedBy = req.user._id;
    await question.save();

    // Also soft delete all comments
    await Comment.updateMany(
      { question: questionId },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id
      }
    );

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question'
    });
  }
});

// PUT /api/forum/comments/:id - Update comment (Admin only)
router.put('/comments/:id', authenticate, async (req, res) => {
  try {
    const commentId = req.params.id;
    const { content } = req.body;

    // Only admins can edit comments
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required to edit comments'
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    comment.content = content;
    await comment.save();
    await comment.populate('author', 'name email isAdmin');

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: comment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment'
    });
  }
});

// DELETE /api/forum/comments/:id - Delete comment (Admin only)
router.delete('/comments/:id', authenticate, async (req, res) => {
  try {
    const commentId = req.params.id;

    // Only admins can delete comments
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required to delete comments'
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Soft delete
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    comment.deletedBy = req.user._id;
    await comment.save();

    // Update question comment count
    await Question.findByIdAndUpdate(comment.question, {
      $inc: { commentCount: -1 }
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment'
    });
  }
});

// GET /api/forum/admin/questions - Get all questions including deleted (Admin only)
router.get('/admin/questions', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const includeDeleted = req.query.includeDeleted === 'true';

    let filter = {};
    if (!includeDeleted) {
      filter.isDeleted = false;
    }

    const questions = await Question.find(filter)
      .populate('author', 'name email')
      .populate('deletedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Question.countDocuments(filter);

    res.json({
      success: true,
      data: questions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions'
    });
  }
});

// GET /api/forum/admin/comments - Get all comments including deleted (Admin only)
router.get('/admin/comments', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const includeDeleted = req.query.includeDeleted === 'true';

    let filter = {};
    if (!includeDeleted) {
      filter.isDeleted = false;
    }

    const comments = await Comment.find(filter)
      .populate('author', 'name email')
      .populate('question', 'title')
      .populate('deletedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Comment.countDocuments(filter);

    res.json({
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments'
    });
  }
});

// PATCH /api/forum/admin/questions/:id/restore - Restore deleted question (Admin only)
router.patch('/admin/questions/:id/restore', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const question = await Question.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null
      },
      { new: true }
    ).populate('author', 'name email');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      message: 'Question restored successfully',
      data: question
    });
  } catch (error) {
    console.error('Error restoring question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore question'
    });
  }
});

// PATCH /api/forum/admin/comments/:id/restore - Restore deleted comment (Admin only)
router.patch('/admin/comments/:id/restore', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null
      },
      { new: true }
    ).populate('author', 'name email');

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Update question comment count
    await Question.findByIdAndUpdate(comment.question, {
      $inc: { commentCount: 1 }
    });

    res.json({
      success: true,
      message: 'Comment restored successfully',
      data: comment
    });
  } catch (error) {
    console.error('Error restoring comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore comment'
    });
  }
});

module.exports = router;
