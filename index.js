
'use strict';

var craigslist = require('node-craigslist')
var extend = require('extend')

function prettyPrint(err, city, listings) {
  if (err) return console.error(err);

  var results = {
    city: city,
    listings: listings
  }

  console.log(JSON.stringify(results, null, 2))
}

module.exports = function search(options, callback) {
  callback = callback || prettyPrint;
  options = extend({ 
    isSites: !options.city, 
    city: 'www' 
  }, options);

  var client = craigslist({
    city : options.city
  });

  client.search(options, '', function handleResults(err, listings) {
    if (err) return callback(err)
      
    if (!listings || !options.isSites) return callback(null, options.city, listings);
    
    // call back per city
    listings.forEach(function (listing) {
      var options1 = extend({}, options, {
        city: listing.city,
        isSites: false
      })

      client.search(options1, '', callback);
    })
  })
}