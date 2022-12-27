var DB = require('mysql-await');

var pool  = DB.createPool({
    host: 'localhost',
    user: 'root',
    database: 'mydb',
    password : '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    throwErrors: false
  });

pool.on('connection', function (connection) {
  console.log('MySQL DB Connection established');
});

pool.on('acquire', function (connection) {
  console.log('Connection %d acquired', connection.threadId);
});

pool.on('enqueue', function () {
  console.log('Waiting for available connection slot...');
});

pool.on('release', function (connection) {
  console.log('Connection %d released', connection.threadId);
});

module.exports = {
    db: pool
};