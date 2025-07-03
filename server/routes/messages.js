const express = require('express');
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

module.exports = function(io) {
  const router = express.Router();

  // POST /api/messages - Create a new message (protected)
  router.post('/', auth, async (req, res) => {
    const { content } = req.body;
    if (!content || content.length > 250) {
      return res.status(400).json({ message: 'Content is required and must be 250 characters or less.' });
    }
    try {
      const message = new Message({
        content,
        author: req.user.id
      });
      await message.save();
      await message.populate('author', 'username');
      const msgObj = message.toObject();
      io.emit('newMessage', msgObj);
      res.status(201).json({ message: 'Message posted successfully.' });
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  });

  // GET /api/messages - Fetch all messages in reverse chronological order
  router.get('/', async (req, res) => {
    try {
      const messages = await Message.find()
        .sort({ timestamp: -1 })
        .populate('author', 'username')
        .lean();
      res.json(messages);
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  });

  // Toggle like/unlike a message
  router.post('/:id/like', auth, async (req, res) => {
    try {
      const message = await Message.findById(req.params.id).populate('author', 'username');
      if (!message) return res.status(404).json({ message: 'Message not found.' });
      const userId = req.user.id;
      const liked = message.likes.includes(userId);
      if (liked) {
        message.likes = message.likes.filter(id => id.toString() !== userId);
      } else {
        message.likes.push(userId);
      }
      await message.save();
      await message.populate({ path: 'comments.userId', select: 'username' });
      io.emit('messageUpdated', message.toObject());
      res.json({ likes: message.likes.length, liked: !liked });
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  });

  // Add a comment to a message
  router.post('/:id/comment', auth, async (req, res) => {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required.' });
    }
    try {
      const message = await Message.findById(req.params.id).populate('author', 'username');
      if (!message) return res.status(404).json({ message: 'Message not found.' });
      const comment = {
        userId: req.user.id,
        text,
        timestamp: new Date()
      };
      message.comments.push(comment);
      await message.save();
      await message.populate({ path: 'comments.userId', select: 'username' });
      io.emit('messageUpdated', message.toObject());
      const lastComment = message.comments[message.comments.length - 1];
      res.status(201).json({ comment: {
        _id: lastComment._id,
        userId: lastComment.userId._id,
        username: lastComment.userId.username,
        text: lastComment.text,
        timestamp: lastComment.timestamp
      }});
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  });

  // Edit a message (author only)
  router.put('/:id', auth, async (req, res) => {
    const { content } = req.body;
    if (!content || content.length > 250) {
      return res.status(400).json({ message: 'Content is required and must be 250 characters or less.' });
    }
    try {
      const message = await Message.findById(req.params.id).populate('author', 'username');
      if (!message) return res.status(404).json({ message: 'Message not found.' });
      if (message.author._id.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized.' });
      }
      message.content = content;
      await message.save();
      await message.populate({ path: 'comments.userId', select: 'username' });
      io.emit('messageUpdated', message.toObject());
      res.json({ message: 'Message updated.' });
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  });

  // Delete a message (author only)
  router.delete('/:id', auth, async (req, res) => {
    try {
      const message = await Message.findById(req.params.id);
      if (!message) return res.status(404).json({ message: 'Message not found.' });
      if (message.author.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized.' });
      }
      await message.deleteOne();
      io.emit('messageDeleted', { _id: req.params.id });
      res.json({ message: 'Message deleted.' });
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  });

  return router;
}; 