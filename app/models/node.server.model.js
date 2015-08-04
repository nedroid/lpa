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
  nodeId: {
    type: String,
    trim: true
  },
  queueLength: {
    type: Number,
    default: 1,
    required: 'Queue length cannot be null'
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
  }
});

mongoose.model('Node', NodeSchema);
