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
	fsms: [{ 
		type: Schema.ObjectId, 
		ref: 'StateMachine' 
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

ProtocolSchema.plugin(deepPopulate);

mongoose.model('Protocol', ProtocolSchema);
