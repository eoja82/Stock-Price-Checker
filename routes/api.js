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
    ip: {type: [String],
         default: []},
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
    //console.log("like " + like)
    var ip = like ? req.ip : null;
    //console.log("ip is " + ip);
    //var stockPrice;    
    
    var getStockPrice = async (stock) => {  
      var url = "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol="
                + stock + "&apikey=" + process.env.ALPHA_API_KEY;
      request(url, {json: true}, function(err, res, body) {
        if (err) { return console.log(err); }
        else {
          console.log("stockPrice = " + body["Global Quote"]["05. price"]); //correctly logs stock price
          return body["Global Quote"]["05. price"];
          
        } 
      })
    };
   
    var addNewStock = async (stock) => {
      var stockPrice = await getStockPrice(stock);
      var newStock = await new Stock({stock: stock, price: stockPrice, likes: like});
      console.log(newStock);
      newStock.save( (err, doc) => {
        if (err) { console.log(err); }
        else {
          res.json({"stock": doc.stock, "price": doc.price, "likes": doc.likes})
        }
      });
    };
    
    var updateStockPriceAndLikes = async (stock) => {
      var stockPrice = await getStockPrice(stock);
      await Stock.findOneAndUpdate({stock: stock}, {price: stockPrice, $inc: {likes: like}, $push: {ip: ip}},
                             {new: true}, function(err, doc) {
        if (err) { console.log(err); }
        else if (!doc) { console.log("updateStockPriceAndLikes failed"); }
        else { console.log("updateStockPriceAndLikes was a success"); }
      })
    };
    
    var updateStockPrice = async (stock) => {
      var stockPrice = await getStockPrice(stock);
      await Stock.findOneAndUpdate({stock: stock}, {price: stockPrice},
                             {new: true}, function(err, doc) {
        if (err) { console.log(err); }
        else if (!doc) { console.log("updateStockPrice failed"); }
        else { console.log("updateStockPrice was a success"); }
      })
    };
    
    async function handleStock1(stock1) {
      if (stock1) {
      if (ip) {   // like is checked
        Stock.findOne({stock: stock1}, function(err, doc) {
          if (err) { console.log(err); }
          else if (!doc) {
            addNewStock(stock1); //not in db, add new
          } else if (doc.ip.indexOf(ip) < 0) {  //ip not found
            updateStockPriceAndLikes(stock1);   //and push ip to db
          } else {
            updateStockPrice(stock1);
          }
        })
      } else if (!ip) {   //like is not checked
        Stock.findOne({stock: stock1}, function(err, doc) {
          if (err) { console.log(err); }
          else if (!doc) {
            addNewStock(stock1);
          } else {
            updateStockPrice(stock1);
          }
        });
      }
    };
  }
  handleStock1(stock1); 
    /*if (stock2) {
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
      } else if (!ip) {
        Stock.findOne({stock: stock2}, function(err, doc) {
          if (err) { console.log(err); }
          else if (!doc) {
            addNewStock(stock2);
          } else {
            updateStockPrice(stock2);
          }
        });
      }
    };*/
    
      
    });
    
};
