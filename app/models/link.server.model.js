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
	label: {
		type: String,
		default: '',
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

mongoose.model('Link', LinkSchema);
