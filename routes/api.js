/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var shortid  = require("shortid");
var mongoose    = require('mongoose');
var request = require("request");
//var xhr = new XMLHttpRequest();
//const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});
mongoose.set('useFindAndModify', false);  //to use findOneAndUpdate

module.exports = function (app) {
  
  var stockSchema = new mongoose.Schema({
    stock: String,
    price: Number,
    ip: [String],
    likes: {
      type: Number,
      default: 0}
  });
  
  var Stock = mongoose.model("Stock", stockSchema);

  app.route('/api/stock-prices')
    .get(function (req, res){
    var stock1 = req.query.stock1; 
    stock1.toUpperCase();
    var stock2 = req.query.stock2; //if stock2 compare stock prices
    if (stock2) { stock2.toUpperCase();}
    var like = req.query.like ? 1 : 0;
    console.log("like " + like)
    var ip = like ? req.ip : null;
    console.log("ip is " + ip);
    var stockPrice;     
    
    var getStockPrice = (stock) => {
      var url = "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol="
                + stock + "&apikey=" + process.env.ALPHA_API_KEY;
      request(url, {json: true}, function(err, res, body) {
        if (err) { return console.log(err); }
        else {
          stockPrice = body["Global Quote"]["05. price"]
          console.log("stockPrice = " + stockPrice);
        } 
      })
    };
   
    var addNewStock = (newStock) => {
      var newStock = new Stock({stock: newStock, price: stockPrice, likes: like, ip: ip});
      console.log(newStock);
      newStock.save( (err, doc) => {
        if (err) { console.log(err); }
        else {
          res.json({"stock": doc.stock, "price": doc.price, "likes": doc.likes})
        }
      });
    };
    
    var updateStockPriceAndLikes = (stock) => {
      Stock.findOneAndUpdate({stock: stock}, {price: stockPrice, $inc: {likes: like}, $push: {ip: ip}},
                             {new: true}, function(err, doc) {
        if (err) { console.log(err); }
        else if (!doc) { console.log("updateStockPriceAndLikes failed"); }
        else { console.log("updateStockPriceAndLikes was a success"); }
      })
    };
    
    var updateStockPrice = (stock) => {
      Stock.findOneAndUpdate({stock: stock}, {price: stockPrice},
                             {new: true}, function(err, doc) {
        if (err) { console.log(err); }
        else if (!doc) { console.log("updateStockPrice failed"); }
        else { console.log("updateStockPrice was a success"); }
      })
    };
    
    if (stock1) {
      getStockPrice(stock1);
      if (ip) { //if liked
        Stock.findOne({stock: stock1}, function(err, doc) {
          if (err) { console.log(err); }
          else if (!doc) {
            addNewStock(stock1);
          } else if (doc.ip.indexOf(ip) < 0) {  //ip not found
            updateStockPriceAndLikes(stock1);
          } else {
            updateStockPrice(stock1);
          }
        })
      }
    };
    
    if (stock2) {
      getStockPrice(stock2);
      if (ip) { //if liked
        Stock.findOne({stock: stock2}, function(err, doc) {
          if (err) { console.log(err); }
          else if (!doc) {
            addNewStock(stock2);
          } else if (doc.ip.indexOf(ip) < 0) {  //ip not found
            updateStockPriceAndLikes(stock2);
          } else {
            updateStockPrice(stock2);
          }
        })
      }
    };
    
      
    });
    
};
