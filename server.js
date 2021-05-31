'use strict';

var express     = require('express');
var bodyParser  = require('body-parser');
var cors        = require('cors');
var mongoose    = require('mongoose');
var apiRoutes         = require('./routes/api.js');
var fccTestingRoutes  = require('./routes/fcctesting.js');
var runner            = require('./test-runner');
var helmet            = require('helmet');
var noCache           = require('nocache');
require('dotenv').config();

var app = express();

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(noCache());

app.use(helmet());
app.use(helmet.noSniff());
app.use(helmet.hidePoweredBy({setTo: "PHP 4.2.0"}));
app.use(helmet.contentSecurityPolicy({
  useDefaults: true,
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", 
                "https://code.jquery.com/jquery-2.2.1.min.js",
                "/public/client.js", 
                "'unsafe-inline'"],
    styleSrc: ["'self'", 
               "https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css",
               "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.8.2/css/all.min.css",
               "/public/style.css", 
               "'unsafe-inline'"]
  }
}));

mongoose.connect(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }).
  catch (err => console.log(err));

mongoose.connection.on("connected", () => {
  console.log("Connected to database!");
});

// handle errors after initial connection
mongoose.connection.on('error', (err) => {
  console.log(err);
});

app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);  
    
//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
app.listen(process.env.PORT || 3000, function () {
  console.log("App is listening");
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
        var error = e;
          console.log('Tests are not valid:');
          console.log(error);
      }
    }, 3500);
  }
});

module.exports = app; //for testing
