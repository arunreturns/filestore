var mongoose = require('mongoose');
var bcrypt = require("bcrypt-nodejs");

var UserSchema = new mongoose.Schema({
  userName: {type: String, lowercase: true, unique: true},
  firstName: {type: String},
  lastName: {type: String},
  password: {type: String},
  email: {type: String},
  phoneNo: {type: Object},
  isAdmin: {type: Boolean, default: false},
  isPasswordChanged: {type: Boolean, default: false}
});


UserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};


module.exports = mongoose.model('User', UserSchema);

