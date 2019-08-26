'use strict';

var express     = require('express');
var bodyParser  = require('body-parser');
var expect      = require('chai').expect;
var cors        = require('cors');
var mongoose    = require('mongoose');
var apiRoutes         = require('./routes/api.js');
var fccTestingRoutes  = require('./routes/fcctesting.js');
var runner            = require('./test-runner');
var helmet            = require('helmet');
var csp               = require('helmet-csp');

var app = express();

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(helmet());
app.use(helmet.noCache());
app.use(helmet.hidePoweredBy({setTo: "PHP 4.2.0"}));
/*app.use(csp({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://code.jquery.com/jquery-2.2.1.min.js", "/public/client.js", "'unsafe-inline'", "https://www.kiplinger.com/slideshow/investing/T052-S001-10-small-cap-growth-stocks-to-buy-now/images/intro.jpg"],
    styleSrc: ["'self'", "https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css", "/public/style.css", "https://www.kiplinger.com/slideshow/investing/T052-S001-10-small-cap-growth-stocks-to-buy-now/images/intro.jpg", "'unsafe-inline'"]
  },
  browserSniff: false
}))*/
//Index page (static HTML)

mongoose.connect(process.env.DATABASE, {useNewUrlParser: true},
  function(err) {
    if (err) { console.log(err); }
    else { console.log("Connected to db!") };
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
  console.log("Listening on port " + process.env.PORT);
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
