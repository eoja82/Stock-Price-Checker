'use strict';

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
    .get(function (req, res) {
      var stock1 = req.query.stock1.toUpperCase().trim();
      var stock2;          //if stock2 compare stock prices
      if (req.query.stock2) { stock2 = req.query.stock2.toUpperCase().trim(); }
      var like = req.query.like ? 1 : 0;
      var ip = like ? req.ip : null;
      var stockPrice;
      var responseStock = [];

      var addNewStock = (stock) => {
        return new Promise((resolve, reject) => {
          var newStock = new Stock({stock: stock, price: stockPrice, likes: like});
          newStock.save( (err, doc) => {
            if (err) { 
              console.log(`Error saving ${stock} to database in addNewStock func: ` + err);
              reject(new Error(`Error saving ${stock} to database in addNewStock func.`)); 
            } else if (!doc) {
              console.log(`Could not add ${stock} to database in addNewStock func.`);
              reject(new Error(`Could not add ${stock} to database in addNewStock func.`));
            } else {
              responseStock.push({"stock": doc.stock, "price": doc.price, "likes": doc.likes});
              resolve();
            }
          });
        }); // end Promise
      };
      
      var updateStockPriceAndLikes = (stock) => {
        return new Promise((resolve, reject) => { 
          Stock.findOneAndUpdate({stock: stock}, {price: stockPrice, $inc: {likes: like}, $push: {ip: ip}}, {new: true}, function(err, doc) {
            if (err) { 
              console.log(`Error updating stock ${stock} in updateStockPriceAndLikes: ` + err);
              reject(new Error(`Updating stock ${stock} in updateStockPriceAndLikes.`));
            }
            else if (!doc) { 
              console.log(`No doc found for stock ${stock} in updateStockPriceAndLike.`)
              reject(new Error(`No doc found for stock ${stock} in updateStockPriceAndLike.`));
            }
            else {  
              responseStock.push({"stock": doc.stock, "price": doc.price, "likes": doc.likes});
              resolve();
            }
          })
        }) // end Promise
      };
      
      var updateStockPrice = (stock) => {
        return new Promise((resolve, reject) => {
          Stock.findOneAndUpdate({stock: stock}, {price: stockPrice}, {new: true}, function(err, doc) {
            if (err) { 
              console.log(`Error updating price for ${stock} in updateStockPrice func `, + err);
              reject(new Error(`Error updating price for ${stock} in updateStockPrice func.`));
            } else if (!doc) { 
              console.log(`No doc found for ${stock} in updateStockPrice func.`);
              reject(new Error(`No doc found for ${stock} in updateStockPrice func.`));
            }
            else { 
              responseStock.push({"stock": doc.stock, "price": doc.price, "likes": doc.likes});
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
                if (err) { 
                  console.log(`Error finding stock ${stock} with like checked in handleStock func: ` + err);
                  reject(new Error(`Finding stock ${stock} with like checked in handleStock func.`));
                }
                else if (!doc) {     //not in db, add new
                  await addNewStock(stock).catch( err => {
                    reject(new Error(err));
                  });   
                  resolve(); 
                } else if (doc.ip.indexOf(ip) < 0) {    //ip not found
                  await updateStockPriceAndLikes(stock).catch( err => {  //and push ip to db
                    reject(new Error(err));
                  });     
                  resolve();
                } else {
                  await updateStockPrice(stock).catch( err => {
                    reject(new Error(err));
                  });
                  resolve();
                }
              })
            } else {   //like is not checked
              Stock.findOne({stock: stock}, async function(err, doc) {
                if (err) { 
                  console.log(`Error finding stock ${stock} in handleStock func: ` + err); 
                  reject(new Error(`Error finding stock ${stock} in handleStock func.`));
                }
                else if (!doc) {
                  await addNewStock(stock).catch( err => {
                    reject(new Error(err));
                  });
                  resolve();
                } else {
                  await updateStockPrice(stock).catch( err => {
                    reject(new Error(err));
                  });
                  resolve();
                }
              });
            }
          };
        })  
      }; 
      
      var getStockPrice = (stock) => {  
        var url = "https://api.iextrading.com/1.0/stock/" + stock + "/book";
        return new Promise( (resolve, reject) => {  // add async here for testing
          /* begin test code */
          /* if (stock === "GOOG") {
            stockPrice = "2417.64";
          } else if (stock === "MSFT") {
            stockPrice = "250.37";
          } else {
            resolve(`${stock} is not a valid stock symbol.`);
          }
          await handleStock(stock).catch( err => {
            reject(new Error(err));
          });
          resolve(); */
          /* end test code */

          request(url, {json: true}, async function(err, resp, body) {
            if (err) { 
              console.log("API request error: " + err); 
              reject(new Error("API Request Error"));
            } else if (body === "Unknown symbol") {
              //res.send(`${stock} is not a valid stock symbol.`);
              console.log(`${stock} is not a valid symbol.`)
              reject(new Error(`${stock} is not a valid symbol.`));
            } else {
              try {
                stockPrice = body["quote"].latestPrice;
              } catch (err) {
                reject(new Error("Could not get latest price from API"));
              }
              await handleStock(stock).catch( err => {
                reject(new Error(err));
              });
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
        let message, promiseError;
        await getStockPrice(stock1).then( msg => {
          if (msg) {
            message = msg;
          }
        }).catch( err => {
          console.log("stock price1 error: " + err);
          promiseError = err;
        });
        if (message) {
          console.log(message);
          res.send(message);
          return;
        }
        if (promiseError) {
          res.send(`Oops! Something went wrong getting a price for ${stock1}.`);
          return;
        }
        if (stock2) { 
          await getStockPrice(stock2).then( msg => {
            if (msg) {
              message = msg;
            }
          }).catch( err => {
            console.log("stock price2 error: " + err);
            promiseError = err;
          }); 
        }
        if (message) {
          console.log(message);
          res.send(message);
          return;
        }
        if (promiseError) {
          res.send(`Oops! Something went wrong getting a price for ${stock2}.`);
          return;
        }
        sendResponse(responseStock);
      })();
                                  
    });
    
};
