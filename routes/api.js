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
    stock2.toUppercase();
    var like = req.query.like ? 1 : 0;
    var ip = like ? req.ip : null;
    var data;
    var stock1Price;
    var stock2Price;
     
    
    var getStockPrice = (stock) => {
      var url = "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol="
                + stock + "&apikey=" + process.env.ALPHA_API_KEY;
      request(url, {json: true}, function(err, res, body) {
        if (err) { return console.log(err); }
        else if (!stock2) {
          stock1Price = body["Global Quote"]["05. price"]
          console.log("stock1Price = " + stock1Price);
        } else {
          stock1Price = body["Global Quote"]["05. price"]
          console.log("stock1Price = " + stock1Price);
          getStockPrice(stock2);
        }
      })
      
    };
   
    var addNewStock = (newStock) => {
      var newStock = new Stock({stock: newStock, price: price, likes: like});
      console.log(newStock);
      newStock.save( (err, doc) => {
        if (err) { console.log(err); }
        else {
          res.json({"stock": doc.stock, "price": doc.price, "likes": doc.likes})
        }
      });
    };
   
    if (!stock2) {  //not comparing stocks
      getStockPrice(stock1);
      Stock.find({stock: stock1}, function(err, doc) {
        if (err) { console.log(err); }
        else if (!doc) {
          addNewStock(stock1);
        } else {
          
        }
      });
      
    }  //else if 2 stocks
    
      
    });
    
};
