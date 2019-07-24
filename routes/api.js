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
    var json;
    var stock1 = req.query.stock1; 
    stock1.toUpperCase;
    var stock2 = req.query.stock2; //if stock2 compare stock prices
    stock2.toUppercase();
    var like = req.query.like ? 1 : 0;
    var ip = like ? req.ip : null;
    var price;
    
    
    var getStockPrice = (stock) => {
      var url = "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol="
                + stock + "&apikey=" + process.env.ALPHA_API_KEY;
      req=new XMLHttpRequest();
      req.open("GET", url, true);
      req.send();
      req.onload=function(){
  	    json=JSON.parse(req.responseText);
      };
    };
    
    var addNewStock = (newStock) => {
      var newStock = new Stock({stock: newStock, price: price, likes: 0});
      console.log(newStock);
      newStock.save( (err, doc) => {
        if (err) { console.log(err); }
        else {
          
        }
      });
    };
    
    if (!stock2) {  //not comparing stocks
      getStockPrice(stock1);
      price = json[1][0]["4. close"];
      Stock.find({stock: stock1}, function(err, doc) {
        if (err) { console.log(err); }
        else if (!doc) {
          
        }
      });
      
    }  //else
    
      
    });
    
};
