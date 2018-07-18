
var settings = require('../settings');
var mysql = require('mysql');

const getConnection = function() {
  let bRet = false
  try {
    let _connection = null
    _connection = mysql.createConnection({
      host     : settings.host,
      database : settings.db,
      user     : settings.user,
      password : settings.password
    });
    
    _connection.connect();
    
    // _connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
    //   if (err) throw err;
    //   console.log('The solution is: ', rows[0].solution);
    // });
    // connection.end();
  
    return _connection;
  } catch(e) {
      console.log(e.message)
      return {error: e.message};
  }
}

module.exports = {
  getConnection: getConnection
}