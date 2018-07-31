const Db = require('../models/db');
const conn = Db.getConnection();
const crypto = require('crypto');


function User(user) {
  this.user_name = user.user_name;
  this.pass_word = user.pass_word;
  this.email = user.email;
};

module.exports = User;

//存储用户信息
User.prototype.save = function (callback) {
  var md5 = crypto.createHash('md5'),
    email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
    head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
  //要存入数据库的用户文档
  let sqlParams = {
    user_name: this.user_name,
    pass_word: this.pass_word,
    email: this.email,
    head: head
  };
  let sqlString = 'insert into t_blog_user set ?';
  let insert = conn.query(sqlString, sqlParams, function (error, results, fields) {
    if (error) {
      console.log('error: ', error)
      return callback(error); //错误，返回error信息
    }
    if (results.insertId) {
      return callback(null, sqlParams);
    }
  });
  console.log(insert.sql);
};

//读取用户信息
User.get = function (name, callback) {
  if (!name) {
    return callback('参数异常');
  }
  let sqlString = 'select * from t_blog_user where user_name = ?';
  let findOne = conn.query(sqlString, name, function (error, results, fields) {
    if (error) {
      console.log('error: ', error)
      return callback(error); //错误，返回error信息
    }
    console.log('results: ', results)
    if (results) {
      return callback(null, results);
    }
  });

  console.log(findOne.sql)
};