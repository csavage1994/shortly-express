var db = require('../config');
var Link = require('./link')
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  url : function(){
    return this.hasMany(Link)
  }
});

module.exports = User;