var express = require('express'),
    // users = require('./routes/user'),
    RSVP = require('rsvp'),
    allSettled = require('promise.allsettled'),
    Promise = require('promise'),
    XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest,
    moment = require('moment');
    axios = require('axios');
    url = require('url');
    bodyParser = require('body-parser');


var server = express();

server.set('views', __dirname + '/views');
server.set('view engine', 'ejs');
server.use(bodyParser.json());

var getRandomArbitrary = function(min, max) {
  return (Math.random() * (max - min) + min).toFixed(7) ;
};

var getRandomLon = function() {
  return getRandomArbitrary(-180, 180).toString();
}

var getRandomLat = function() {
  return getRandomArbitrary(-90, 90).toString() ;
}

// Axios does not have allSettled method
// Using RSVP's allSettled.
axios.allSettled = function(promises){
  return RSVP.allSettled(promises);
};

// Call the Sunrise/Sunset API
var sunriseSunsetCall = function(res, log, cnt, idx, times) {
  var URLs = [];
  var i = 0;

  // Create CNT Promises. This is to assure no more than 5 Promises
  // will be settled at once. CNT will be 5 or less

  console.log(cnt);
  while(i++ <cnt) {
    URLs.push(axios.get('https://api.sunrise-sunset.org/json?lat=' + getRandomLat() + '&lng=' + getRandomLon()));
  }

  // Settle the promises
  axios.allSettled(URLs).then((result) => {

      result.forEach(element => {

          if (element == undefined || element.state !== "fulfilled") {
            log.set("error-network", 1);
            return;
          }  

          var day_length = element.value.data.results.day_length;

          if( day_length === '00:00:00' ) {
            log.set("error-count", log.get("error-count")+1);
          } else {
            log.set("success-count", log.get("success-count")+1);

            var sunset = element.value.data.results.sunset;
            var sunrise = element.value.data.results.sunrise;
            var mSunrise = moment(sunrise, 'LTS'); 
            var mSunset = moment(sunset, 'LTS'); 

            console.log(sunset);
            console.log(sunrise);
            console.log(day_length);
            console.log("\n");

            var values = new Map();
            values.set('sunset', sunset);
            values.set('sunrise', sunrise);
            values.set('day_length', day_length);

            const params = url.parse(element.value.config.url,true).query;

            values.set('lat', params['lat']);
            values.set('lng', params['lng']);
            values.set('sunset_moment', mSunset);
            values.set('sunrise_moment', mSunrise);
   
            times.push(values); 

          }      

        }
      );

      console.log(idx +  " E-" +log.get("error-count") + " S-" + log.get("success-count") );
      console.log("\n\n\n");

      if(log.get("error-count") > 0) {
        var errs = log.get("error-count") ;
        log.set("error-count", 0);  
        sunriseSunsetCall(res, log, errs, idx, times);
      }


      if(log.get("success-count") == 25) {

          var minimum = times.reduce((acc, val) => {
 
 console.log( String( acc  ) );



          console.log(val.get("sunrise"));
          console.log( acc.get("sunrise") );
          //console.log( JSON.stringify(acc)  );

          

          // accum = JSON.stringify(acc) === "[]" ? val : acc; 

           //|| val.get("sunrise_moment").isSameOrBefore(acc.get("sunrise_moment")) ? val : acc;

           var accum = val;
          return accum;
        }, []);



        var output = "sunrise: " + minimum.get("sunrise")
                      + "sunset: " + minimum.get("sunset") 
                    + "day_length: " + minimum.get("day_length")
                    + "lat: " + minimum.get("lat")
                    + "long" + minimum.get("lng");


      console.log(output);




 
      }




  }); 

  



}


server.get('/', function (req, res) {
  var i =0;  
  const log = new Map();
  const times = [];

  log.set("error-count", 0);
  log.set("success-count", 0);
  log.set("error-network", 0);

  while( i++ < 5) {
    sunriseSunsetCall(res, log, 5, i, times);
  }

        res.render("geo", {
            output: " output " 
        });


  if(log.get("error-network") == 1) {

  } else {

 
       // res.render("geo", {
        //  user: "Coordinate to come"
       // }//);


  }

});


server.listen(3000);
console.log('Listening on port 3000...');


