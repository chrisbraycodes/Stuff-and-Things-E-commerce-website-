const express = require('express');
const fetch = require('node-fetch');
const app = express();
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql');
const pool = require('./dbPool.js');

app.set('view engine', 'ejs');
app.use(session({
  secret: 'top secret!',
  resave: true,
  saveUninitialized: false,
}));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// You can use this to access the user session in EJS files.
// ex.  <%= user.id %> or <%= user %>
app.use((req, res, next) => {
  app.locals.user = req.session.user || {};
  next();
});

// If user is not logged in, redirect to login.
app.use((req, res, next) => {
  if (req.session.user === undefined && !isNonAuthenticatedRoute(req.path)) {
    res.redirect('/login');
  } else {
    next();
  }
});

//routes

// Gets the store page.
app.get('/', async (req, res) => {
  const url = 'https://fakestoreapi.com/products';
  const response = await fetch(url);
  const products = await response.json();
  let itemsInCart = 0;

  if (req.session.authenticated) {
    let sql = `
      SELECT * FROM cartstoproducts
      WHERE user_ID = ?
    `;
    let params = [req.session.user.userID];

    let items = await executeSQL(sql, params);
    itemsInCart = items.reduce((previousQuantity, item) => {
      return previousQuantity + item.quantity;
    }, 0);
  }

  res.render('index', {
    products,
    itemsInCart,
  });
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

// Creates a new user in the database.
app.post('/signup', async function(req, res){
  let firstName = req.body.fName;
  let lastName = req.body.lName;
  let gender = req.body.gender;
  let username = req.body.username;
  let password = req.body.password;
  let streetAddress = req.body.streetAddress;
  let zip = req.body.zip;
  let city = req.body.city;
  let state = req.body.state;

  let sql = `
    SELECT * FROM users
    WHERE username = ?
  `;
  let rows = await executeSQL(sql, [username]);

  if (rows && rows.length > 0) {
    return res.render('signup', { usernameError: true });
  }

  const hashedPassword = await bcrypt.hash(password, 1);
  
  sql = `
    INSERT INTO users (firstName, lastName, gender, username, password, streetAddress, city, state, zipCode)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
 
  let params = [
    firstName,
    lastName,
    gender,
    username,
    hashedPassword,
    streetAddress,
    city,
    state,
    zip
  ];
  await executeSQL(sql, params);
  res.redirect('/login');
});

// Renders the login page.
app.get('/login', (req, res) => {
  res.render('login');
});

// Logs a user in and sets the session.
app.post('/login', async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let passwordMatch = false;
  let hashedPwd = '';

  let sql = `SELECT * FROM users WHERE username = ?`;
  let rows = await executeSQL(sql, [username]);

  if(rows && rows.length > 0) {
    hashedPwd = rows[0].password;
    passwordMatch = await bcrypt.compare(password, hashedPwd);
    delete rows[0]['password'];
  }

  if (passwordMatch) {
    req.session.authenticated = true;
    req.session.user = rows[0];
    res.redirect('/profile');
  } else {
    res.render('login', { loginError: true });
  }
});

// Renders the profile page with the user's data.
app.get('/profile', async function(req, res){
  let sql = `SELECT firstName, lastName, gender, username, streetAddress, city, state, zipCode from users WHERE userID = ?`;
  let params = [req.session.user.userID];
  let rows = await executeSQL(sql, params);

  res.render('profile', { userInfo: rows });
});

app.get('/profile-update', async function(req, res){
  let sql = `SELECT firstName, lastName, gender, username, streetAddress, city, state, zipCode from users WHERE userID = ?`;
  let params = [req.session.user.userID];
  let rows = await executeSQL(sql, params);

  res.render('updateProfile', { userInfo: rows });
});

app.post('/profile-update', async function(req, res){

  let fname  = req.body.fName;
  let lname  = req.body.lName;
  let gender = req.body.gender;
  let street = req.body.streetAddress;
  let city   = req.body.city;
  let state  = req.body.state;
  let zip    = req.body.zip;


  let sql = `
    UPDATE users
    SET firstName = ?,
        lastName = ?,
        gender = ?,
        streetAddress = ?,
        city = ?,
        state = ?,
        zipCode = ?
    WHERE userID = ?
  `;
  let params = [fname, lname, gender, street, city, state, zip, req.session.user.userID];
  let rows = await executeSQL(sql, params);

  res.redirect('/profile');
});

// Logs a user out and destroys the session.
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Renders a user's purchase history.
app.get('/purchaseHistory', async function(req, res){
  let sql = `SELECT receiptID, total, purchaseDate as date from receipts WHERE user_ID = ?`;
  let params = [req.session.user.userID];
  let rowsOfReceiptIDs = await executeSQL(sql, params);

  let invoices = [];

  for(i = 0; i < rowsOfReceiptIDs.length; i++) {
    sql = `SELECT  productName, price, quantity from receiptstoproducts INNER JOIN products ON product_ID = productID INNER JOIN receipts ON receiptID = receipt_ID WHERE receipt_ID = ?`;
    params = [rowsOfReceiptIDs[i].receiptID];
    let invoice = await executeSQL(sql, params);
    invoices.push(invoice);
  }

  res.render('purchaseHistory', { receipts: rowsOfReceiptIDs, purchaseHistory: invoices });
});

// Renders the shopping cart with all products in the cart.
app.get('/shoppingcart', async (req, res) => {
  //products and quantities
  let sql = `
    SELECT  productName, price, quantity, (price * quantity) as total, imageURL as url FROM cartstoproducts INNER JOIN products ON product_ID = productID
    WHERE user_ID = ?`
  ;
  let params = [req.session.user.userID];

  let invoice = await executeSQL(sql, params);

  //Total 
  sql = `
    SELECT sum(price * quantity) as subTotal, sum(price * quantity)*1.07 as total
    FROM cartstoproducts
    INNER JOIN products ON product_ID = productID
    WHERE user_ID = ?`
  ;

  params = [req.session.user.userID];

  let totals = await executeSQL(sql, params);

  res.render('shoppingcart', { items: invoice, totals: totals });
});

app.post('/shoppingcart/clear', async (req, res) => {
  //delete your cart
  let sql = `DELETE FROM cartstoproducts WHERE user_ID = ?`;
  await executeSQL(sql, [req.session.user.userID]);

  res.redirect('/');
});

// Renders the checkout page.
app.get('/checkout', async function (req, res) {
  let sql = `SELECT firstName, lastName, zipCode, city, state FROM users WHERE userID = ?`;
  let params = [req.session.user.userID];
  let rows = await executeSQL(sql, params);

  res.render('checkout',{ userInfo: rows });
});

// Completes a purchase from the checkout page.
app.post('/checkout', async function(req, res){
  var purchaseDate = new Date();
  var dd = String(purchaseDate.getDate()).padStart(2, '0');
  var mm = String(purchaseDate.getMonth() + 1).padStart(2, '0'); 
  var yyyy = purchaseDate.getFullYear();

  purchaseDate = yyyy + '-' + mm + '-' + dd;

  // Get total price of cart.
  let sql = `SELECT product_ID, productName, price, quantity, (price * quantity) as total, imageURL as url from cartstoproducts INNER JOIN products ON product_ID = productID WHERE user_ID = ?`;
  let productsToBuy = await executeSQL(sql, [req.session.user.userID]);


  let grandTotal = 0;
  for (row of productsToBuy) {
    grandTotal += row.total;
  }

  // Insert new entry on receipts table.
  sql = `INSERT into receipts (user_ID, total, purchaseDate) VALUES (?, ?, ?)`;
  let params = [req.session.user.userID, grandTotal, purchaseDate];
  let rows = await executeSQL(sql, params);

  let thisReceiptID = rows.insertId;

  for (product of productsToBuy) {
    sql = `
      INSERT INTO receiptstoproducts (receipt_ID, user_ID, product_ID, quantity)
      VALUES (?, ?, ?, ?);
    `;
    params = [thisReceiptID, req.session.user.userID, product.product_ID, product.quantity];
    let status = await executeSQL(sql, params);
  }

  // Delete entries from the cart.
  sql = `
    DELETE FROM cartstoproducts WHERE user_ID = ?
  `;
  params = [req.session.user.userID];
  await executeSQL(sql, params);

  req.session.currReceipt = thisReceiptID;
  res.redirect('/thankyou');
});

// Routes to thank you page after completing a purchase.
app.get('/thankyou', async function(req, res){
  let sql = `
    SELECT products.productName, quantity FROM receiptstoproducts
    INNER JOIN products ON receiptstoproducts.product_ID = products.productID
    WHERE receiptstoproducts.user_ID = ? and receipt_ID = ?;
  `;

  let params = [req.session.user.userID, req.session.currReceipt];

  let products = await executeSQL(sql, params);

  sql = `
    SELECT total FROM receipts
    WHERE receiptID = ?;
  `;
  params = [req.session.currReceipt];
  let receipts = await executeSQL(sql, params);
  
  res.render('thankyou', {
    products,
    grandTotal: receipts[0].total
  });
});

// Adds product to store.
app.post('/cart/add-product', async (req, res) => {
  const productId = req.body.productId;

  let sql = `
    SELECT * FROM cartstoproducts
    WHERE user_ID = ${req.session.user.userID} AND product_ID = ${productId}
  `;
  let rows = await executeSQL(sql);

  if (rows.length > 0) {
    sql = `
      UPDATE cartstoproducts SET quantity = ${rows[0].quantity + 1}
      WHERE user_ID = ${req.session.user.userID} AND product_ID = ${productId}
    `;

    await executeSQL(sql);
  } else {
    sql = `
      INSERT INTO cartstoproducts (user_ID, product_ID, quantity)
      VALUES (?, ?, ?)
    `;
    let params = [req.session.user.userID, productId, 1];

    await executeSQL(sql, params);
  }

  res.redirect('/');
});

// Execute the SQL
async function executeSQL(sql, params){
  return new Promise (function(resolve, reject) {
    pool.query(sql, params, function (err, rows, fields) {
      if (err) throw err;
      resolve(rows);
    });
  });
}

// Checks if route does not require authorization.
function isNonAuthenticatedRoute(route) {
  const nonAuthenticatedRoutes = [
    '/',
    '/login',
    '/signup',
  ];

  return nonAuthenticatedRoutes.includes(route);
}

// Start server.
app.listen(3000, () => {
  console.log('server started');
});
