const Db = require('../models/db');
const conn = Db.getConnection();

function User(user) {
  this.user_name = user.user_name;
  this.pass_word = user.pass_word;
  this.email = user.email;
};

module.exports = User;

//存储用户信息
User.prototype.save = function (callback) {
  //要存入数据库的用户文档
  let sqlParams = {
    user_name: this.user_name,
    pass_word: this.pass_word,
    email: this.email
  };
  let sqlString = 'insert into t_blog_user set ?';
  let inset = conn.query(sqlString, sqlParams, function (error, results, fields) {
    if (error) {
      console.log('error: ', error)
      return callback(error); //错误，返回error信息
    }
    if (results.insertId) {
      return callback(null, 'success');
    }
  });
  console.log(inset.sql);
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
    console.log('results: ', JSON.stringify(results))
    if (results) {
      return callback(null, results);
    }
  });

  console.log(findOne.sql)
};