/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect      = require('chai').expect;
var MongoClient = require('mongodb');
var shortid     = require("shortid");
var mongoose    = require('mongoose');
var request     = require("request");

// to use findOneAndUpdate
mongoose.set('useFindAndModify', false);  

module.exports = function (app) {
  
  var stockSchema = new mongoose.Schema({
    stock: String,
    price: String,
    ip: { type: [String], default: [] },
    likes: { type: Number, default: 0 }
  });
  
  var Stock = mongoose.model("Stock", stockSchema);
  
  app.route('/api/stock-prices')
    .get(function (req, res){
    var stock1 = req.query.stock1.toUpperCase();
    var stock2;          //if stock2 compare stock prices
    if (req.query.stock2) { stock2 = req.query.stock2.toUpperCase(); }
    var like = req.query.like ? 1 : 0;
    var ip = like ? req.ip : null;
    var stockPrice;
    var responseStock = [];

    var addNewStock = (stock) => {
      return new Promise((resolve, reject) => { 
      var newStock = new Stock({stock: stock, price: stockPrice, likes: like});
      console.log(newStock);
      newStock.save( (err, doc) => {
        if (err) { console.log(err); }
        else if (!doc) { console.log("addNewStock failed")} 
        else {
          console.log("addNewStock was a success"); 
          responseStock.push({"stock": doc.stock, "price": doc.price, "likes": doc.likes});
          console.log(responseStock);
          resolve();
        }
      });
    }); // end Promise
    };
    
    var updateStockPriceAndLikes = (stock) => {
      return new Promise((resolve, reject) => { 
        Stock.findOneAndUpdate({stock: stock}, {price: stockPrice, $inc: {likes: like}, $push: {ip: ip}},
                             {new: true}, function(err, doc) {
        if (err) { console.log(err); }
        else if (!doc) { console.log("updateStockPriceAndLikes failed"); }
        else { 
          console.log("updateStockPriceAndLikes was a success"); 
          responseStock.push({"stock": doc.stock, "price": doc.price, "likes": doc.likes});
          console.log(responseStock);
          resolve();
        }
      })
    }) // end Promise
    };
    
    var updateStockPrice = (stock) => {
      return new Promise((resolve, reject) => {
      console.log("stockPrice = " + stockPrice)
      Stock.findOneAndUpdate({stock: stock}, {price: stockPrice},
                             {new: true}, function(err, doc) {
        if (err) { console.log(err); }
        else if (!doc) { console.log("updateStockPrice failed"); }
        else { 
          console.log("updateStockPrice was a success");
          responseStock.push({"stock": doc.stock, "price": doc.price, "likes": doc.likes});
          console.log(responseStock);
          resolve();
        }
      })
    }) // end Promise
    };
      
    var handleStock = (stock) => {
      return new Promise((resolve, reject) => { 
      if (stock) {
       if (ip) {       // like is checked
       Stock.findOne({stock: stock}, async function(err, doc) {
          if (err) { console.log(err); }
          else if (!doc) { 
            await addNewStock(stock);   //not in db, add new
            resolve(); 
          } else if (doc.ip.indexOf(ip) < 0) {    //ip not found
            await updateStockPriceAndLikes(stock);     //and push ip to db
            resolve();
          } else {
            await updateStockPrice(stock);
            resolve();
          }
        })
       } else if (!ip) {   //like is not checked
        Stock.findOne({stock: stock}, async function(err, doc) {
          if (err) { console.log(err); }
          else if (!doc) {
            await addNewStock(stock);
            resolve();
          } else {
            await updateStockPrice(stock);
            resolve();
          }
        });
      }
    };
    })  
  }; 
    
    var getStockPrice = (stock) => {  
      var url = "https://api.iextrading.com/1.0/stock/" + stock + "/book";
        return new Promise( (resolve, reject) => { 
          request(url, {json: true}, async function(err, resp, body) {
            console.log("body: " + body)
            if (err) { console.log(err); }
            else if (body == ) {
              res.send("please enter a valid stock");
              reject();
            } else {
              console.log("latestPrice: " + body["quote"].latesPrice)
              stockPrice = body["quote"].latestPrice;
              await handleStock(stock);
              resolve();
            } 
          })
        }) // end Promise
    };
    
    var sendResponse = (response) => {
      if (responseStock.length > 1) {   //user entered 2 stocks to compare
        var likes0 = response[0].likes - response[1].likes;   //compare relative likes
        var likes1 = response[1].likes - response[0].likes;
        res.json({"stockData": [{"stock": response[0].stock, "price": response[0].price, "rel_likes": likes0},
                               {"stock": response[1].stock, "price": response[1].price, "rel_likes": likes1}]});
      } else {
        res.json({"stockData": response});
      };
    };
    
    (async () => {  
      await getStockPrice(stock1);
      if (stock2) { await getStockPrice(stock2); }  
      sendResponse(responseStock);
    })();
                                  
    });
    
};
