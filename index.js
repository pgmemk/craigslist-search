var craigslist = require('node-craigslist');

var print = function(err, listing) {
  console.log(JSON.stringify(listing, null, 2))
}

module.exports = function queryCraigslist(options, callback) {
  callback = callback | print;

  var client = craigslist({
     city : options.city ? options.city : 'newyork'
  })

  if (options.citiesOnly)
    options.allCities = true

  client.search(options, '', function (err, listings) {
    if (err) return callback(err);
    
    if (!listings || options.citiesOnly) {
      callback(err, listings)
      return;
    }

    var all = options.allCities
    if (!all) {
      callback(err, listings)
      return;
    }
    
  // play with listings here...
    listings.forEach(function (listing) {
      var options1 = { city: listing.city }
      Object.keys(options).forEach(function(key) {
        if (key !== 'allCities')
          options1[key] = options[key]
      });

      client.search(options1, '', callback);
    })
  })
}