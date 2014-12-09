var QueryCraigslist = module.exports = function(options, callback) {
  var  craigslist = require('node-craigslist');
  client = craigslist({
     city : options.city ? options.city : 'newyork'
  })

  var print = function(listing) {
    console.log(JSON.stringify(listing, null, 2))
  }
  client.search(options, '', function (err, listings) {
  	if (!listings) 
      return;
    if (!callback)
      callback = print
    if (options.citiesOnly) {
      callback(listings)
      return;
    }

    var all = options.allCities
    if (!all) {
      callback(listings)
      return;
    }
    
  // play with listings here...
    listings.forEach(function (listing) {
      var options1 = { city: listing.city, category: options.category }
      client.search(options1, '', function (err, l1) {
        if (l1) {
          callback(l1)
        }
      })
    })
  })
}