'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var NodeSchema = new Schema({
  label: {
    type: String,
    default: '',
    trim: true,
    required: 'Label cannot be blank'
  },
  type: {
    type: String, 
    enum: [
      'PROCESS',
      'START_STATE',
      'ACCEPT_STATE'
    ],
    required: 'Type cannot be blank'
  },
  node_id: {
    type: String,
    trim: true
  },
  x: {
    type: Number,
    default: 0,
    required: 'X coordinate of node cannot be null'
  },
  y: {
    type: Number,
    default: 0,
    required: 'Y coordinate of node cannot be null'
  },
  size: {
    type: Number,
    default: 12,
    required: 'Size cannot be null'
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

mongoose.model('Node', NodeSchema);
