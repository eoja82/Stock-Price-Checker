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

mongoose.set('useFindAndModify', false);  //to use findOneAndUpdate
//var xhr = new XMLHttpRequest();
//const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {
  
  var stockSchema = new mongoose.Schema({
    stock: String,
    price: String,
    ip: {type: [String],
         default: []},
    likes: {
      type: Number,
      default: 0}
  });
  
  var Stock = mongoose.model("Stock", stockSchema);
  
  app.route('/api/stock-prices')
    .get(function (req, res){
    var stock1 = req.query.stock1.toUpperCase();
    var stock2; //if stock2 compare stock prices
    if (req.query.stock2) { stock2 = req.query.stock2.toUpperCase();}
    var like = req.query.like ? 1 : 0;
    //console.log("like " + like)
    var ip = like ? req.ip : null;
    //console.log("ip is " + ip);
    var stockPrice;
    var responseStock = [];
    
    var sendResponse = async (response) => {
      if (response.lenght > 1) { //user entered 2 stocks to compare
        var likes0 = response[0].likes - response[1].likes; //compare relative likes
        var likes1 = response[1].likes - response[0].likes;
        await res.json({"stockData": [{"stock": response[0].stock, "price": response[0].price, "rel_likes": likes0},
                               {"stock": response[1].stock, "price": response[1].price, "rel_likes": likes1}]});
      } else {
        console.log("responseStock = " + response);
        await res.json({"stockData": response});
        
      };
    };

    var addNewStock = async (stock) => {
      var newStock = await new Stock({stock: stock, price: stockPrice, likes: like});
      console.log(newStock);
      newStock.save( (err, doc) => {
        if (err) { console.log(err); }
        else if (!doc) { console.log("addNewStock failed")} 
        else {
          console.log("addNewStock was a success"); 
          responseStock.push({"stock": doc.stock, "price": doc.price, "likes": doc.likes});
          console.log(responseStock);
        }
      });
    };
    
    var updateStockPriceAndLikes = async (stock) => {
      await Stock.findOneAndUpdate({stock: stock}, {price: stockPrice, $inc: {likes: like}, $push: {ip: ip}},
                             {new: true}, function(err, doc) {
        if (err) { console.log(err); }
        else if (!doc) { console.log("updateStockPriceAndLikes failed"); }
        else { 
          console.log("updateStockPriceAndLikes was a success"); 
          responseStock.push({"stock": doc.stock, "price": doc.price, "likes": doc.likes});
          console.log(responseStock);
        }
      })
    };
    
    var updateStockPrice = async (stock) => {
      console.log("stockPrice = " + stockPrice)
      await Stock.findOneAndUpdate({stock: stock}, {price: stockPrice},
                             {new: true}, async function(err, doc) {
        if (err) { console.log(err); }
        else if (!doc) { console.log("updateStockPrice failed"); }
        else { 
          console.log("updateStockPrice was a success");
          responseStock.push({"stock": doc.stock, "price": doc.price, "likes": doc.likes});
          console.log(responseStock);
        }
      })
    };
      
    var handleStock = async (stock) => {
      if (stock) {
       if (ip) {   // like is checked
       await Stock.findOne({stock: stock}, async function(err, doc) {
          if (err) { console.log(err); }
          else if (!doc) { 
           await  addNewStock(stock); //not in db, add new
          } else if (doc.ip.indexOf(ip) < 0) {  //ip not found
            await updateStockPriceAndLikes(stock);   //and push ip to db
          } else {
            await updateStockPrice(stock);
          }
        })
       } else if (!ip) {   //like is not checked
        await Stock.findOne({stock: stock}, async function(err, doc) {
          if (err) { console.log(err); }
          else if (!doc) {
            await addNewStock(stock);
          } else {
            await updateStockPrice(stock);
          }
        });
      }
    };
  };
    
    var getStockPrice = async (stock) => {  
      var url = "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol="
                + stock + "&apikey=" + process.env.ALPHA_API_KEY;
        await request(url, {json: true}, async function(err, resp, body) {
        if (err) { console.log(err); }
          else if (!body["Global Quote"]["05. price"]) {
            await res.send("please enter a valid stock");
          }
        else {
          //console.log("stockPrice = " + body["Global Quote"]["05. price"]); //correctly logs stock price
          stockPrice = body["Global Quote"]["05. price"];
          await handleStock(stock);
        } 
      })
    };
    
    var begin = async () => {  
      await getStockPrice(stock1);
      if (stock2) {
        await getStockPrice(stock2);
      }  
      await sendResponse(responseStock);
    };
   
    begin();
    /*responseStock = [ { stock: 'GOOG', price: '1250.4100', likes: 0 },
  { stock: 'MSFT', price: '141.3400', likes: 0 } ]*/
                            
      
    });
    
};
