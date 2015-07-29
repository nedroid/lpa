'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var LinkSchema = new Schema({
  source: { 
    type: Schema.ObjectId, 
    ref: 'Node',
    required: 'Source node cannot be null'
  },
  target: { 
    type: Schema.ObjectId, 
    ref: 'Node',
    required: 'Target node cannot be null'
  },
  typeId: {
    type: String,
    default: 'UNKNOWN',
    trim: true
  },
  name: {
    type: String,
    default: 'x',
    trim: true
  },
  processId: {
    type: String,
    trim: true
  },
  queueInLength: {
    type: Number,
    default: 1,
    required: 'Queue In Length cannot be null'
  },
  queueOutLength: {
    type: Number,
    default: 1,
    required: 'Queue In Length cannot be null'
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

mongoose.model('Link', LinkSchema);
