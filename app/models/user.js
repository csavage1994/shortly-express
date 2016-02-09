var db = require('../config');
var Link = require('./link.js')
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  url : function(){
    return this.hasMany(Link)
  },
  encryptPassword: function(string){
    // bcrypt
    return bcrypt.hash(string);
  }  
});

module.exports = User;