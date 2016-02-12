var mongoose = require('mongoose');

var ApiSchema = new mongoose.Schema({
  type: {type: String},
  key: {type: String}
});

module.exports = mongoose.model('Apis', ApiSchema);

