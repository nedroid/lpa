'use strict';

var mongoose = require('mongoose'),
  deepPopulate = require('mongoose-deep-populate'),
  Schema = mongoose.Schema;

var ProtocolSchema = new Schema({
  title: {
    type: String,
    default: '',
    trim: true,
    required: 'Title cannot be blank'
  },
  processes: { 
    type: Schema.ObjectId, 
    ref: 'Graph' 
  },
  finalstatemachines: [{ 
    type: Schema.ObjectId, 
    ref: 'Graph' 
  }],
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  created: {
    type: Date,
    default: Date.now
  }
});

ProtocolSchema.plugin(deepPopulate, {
  populate: {
    'user': {
      select: 'displayName'
    }
  }
});

mongoose.model('Protocol', ProtocolSchema);
