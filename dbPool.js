const mysql = require('mysql');

const pool  = mysql.createPool({
    connectionLimit: 10,
    host: 'w3epjhex7h2ccjxx.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user: 'xqg9idzv7v3smt79',
    password: 'dw63fw0cyvipj7wl',
    database: 'p4gfg463l26dpiwv',
});

module.exports = pool;
