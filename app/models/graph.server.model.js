'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var GraphSchema = new Schema({
  title: {
    type: String,
    default: '',
    trim: true,
    required: 'Title cannot be blank'
  },
  nodes: [{ 
    type: Schema.ObjectId, 
    ref: 'Node'
  }],
  links: [{ 
    type: Schema.ObjectId, 
    ref: 'Link'
  }],
  type: {
    type: String,
    default: 'UNKNOWN',
    trim: true,
    required: 'Type cannot be blank'
  },
  parentNodeId: {
    type: String,
    trim: true
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  created: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('Graph', GraphSchema);
