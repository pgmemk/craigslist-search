var  craigslist = require('node-craigslist');
var print = function(err, listing) {
  if (err)
    return err;
  console.log(JSON.stringify(listing, null, 2))
}
var QueryCraigslist = module.exports = function(options, callback) {
  client = craigslist({
     city : options.city ? options.city : ''
  })

  if (options.citiesOnly)
    options.allCities = true
  client.search(options, '', function (err, listings) {
  	if (!listings) 
      return;
    if (!callback)
      callback = print
    if (options.citiesOnly) {
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
      var options1 = { city: listing.city, cityName: listing.cityName }
      Object.keys(options).forEach(function(key) {
        if (key != 'allCities')
          options1[key] = options[key]
      })
      client.search(options1, '', function (err, l1) {
        if (l1) 
          callback(err, l1)
      })
    })
  })
}