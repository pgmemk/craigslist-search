
var Q = require('q');
var cheerio = require('cheerio');
var craigslist = require('node-craigslist');

var print = function(err, listing) {
  if (err) return err;

  console.log(JSON.stringify(listing, null, 2))
}

module.exports = function(options, callback) {
  if (options.url) 
    options.fullListing = true

  if (options.categoriesOnly)
    options.categoriesOnly = true
  
  if (options.all == 'y')
    options.allCities = true

  if (options.citiesOnly)
    options.allCities = true

  var url = options.url
  if (url) {
    var idx = url.indexOf('://') + 3;
    var idx1 = url.indexOf('/', idx);
    options.hostname = url.substring(idx, idx1)
    options.path = url.substring(idx1)
    options.fullListing = true
  }

  options.isFullDescriptionRequest = options.fullListing  &&  options.path

  return new Search(options)
    .run(callback || print);
}

function Search(options) {
  this.options = options
  this.client = craigslist({
     city : options.city ? options.city : ''
  })  
}

Search.prototype.run = function(callback) {
  var self = this
  var fn
  var options = this.options

  if (options.allCities)
    fn = 'getCities'
  else if (options.rss)
    fn = 'getRssListings'
  else if (options.isFullDescriptionRequest)
    fn = 'getDescription'
  else if (options.categoriesOnly)
    fn = 'getCategories'
  else
    fn = 'getListings'

  return Q.ninvoke(this.client, 'search', options, '')
    .then(function(html) {
      return self[fn](options, html)
    })
    .then(function(results) {
      callback(null, results);
    })
    .catch(callback)
}

/*
  Accepts string of HTML and parses that string to find all pertinent listings.
*/
Search.prototype.getListings = function(options, html) {
  return this.client.getListings(options, html)
}

Search.prototype.getCities = function(options, html) {
  var self = this;
  var $ = cheerio.load(html);
  var listing = {};
  var listings = [];

  $('div.colmask').find('a').each(function (i, element) {
    var href = $(element).attr('href')
    var idx = href.indexOf('//'), idx1 = href.indexOf('.');


    listing = { 
      city: href.substring(idx + 2, idx1),
      href: href,
      cityName: $(element).text().replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()})
    }

     listings.push(listing)
  })  

  if (options.citiesOnly) return Q.resolve(listings)

  // play with listings here...
  var results = {};
  var tasks = listings.slice(10, 15).map(function (listing) {
    var options1 = { 
      city: listing.city, 
      cityName: listing.cityName 
    }

    Object.keys(options).forEach(function(key) {
      if (key != 'allCities')
        options1[key] = options[key]
    })

    options1.hostname = listing.href
    options1.path = '/search/' + options.category

    return Q.ninvoke(self.client, 'search', options1, '')
      .then(function(html) {
        results[listing.city] = self.getListings(options1, html)
      })
      .catch(function(err) {
        results[listing.city] = 'ERROR: ' + err
      });
  })

  return Q.allSettled(tasks)
    .then(function() {
      return results
    })
}

Search.prototype.getCategories = function(options, html) {
  var $ = cheerio.load(html)
  var listing = {}
  var listings = []
  var city = $('h2.no-mobile').html()
  var idx = city.indexOf('<')
  if (idx != -1)
    city = city.substring(0, idx)

  $('div#center').find('a').each(function (i, element) {
    var href = $(element).attr('href')
    if (href.indexOf('/search/') != 0)
      return;
    var idx = href.indexOf('//'), idx1 = href.indexOf('.');


    listing = { 
      categoryName: $(element).text(),
      categoryHref: href,
      city: city
    }

    listings.push(listing)
  })  

  return listings
}

Search.prototype.getSubCities = function(options, html) {
  var $ = cheerio.load(html)
  var listing = {}
  var listings = []
  var city = $('h2.no-mobile').html()
  var idx = city ? city.indexOf('<') : -1
  if (idx != -1)
    city = city.substring(0, idx)

  $('ul.sublinks').find('a').each(function (i, element) {
     var href = $(element).attr('href')

     listing = { subCityHref: options.hostname + href, 
                 subCity: $(element).attr('title')
               }

     listings.push(listing)
  })  

  // nearby cities
  var rightPanelElms = $('div#rightbar').find('.menu .collapsible').find('li')

  for (var i=0; i<rightPanelElms; i++) {
    var li = rightPaneElms.get(i)
    if ($(li).find('h5').get(0).text() != 'nearby cl')
      continue;

    $(li).find('a').each(function(i, element) {
      listing = { 
        city: $(element).text(),
          href: $(element).attr('href')
        }
    })
  }

  return listings
}

/**
 * Extract full description for the listing
 */
Search.prototype.getDescription = function(options, html) {
  var $ = cheerio.load(html);

  var description = $('section#postingbody').html()
  var listing = {}
  if (description)
      listing.description = description.trim()
  var attr = $('p.attrgroup')
  if (!attr) 
    return listing
  attr.find('span').each(function(i, p) {
    if ($(p).attr('class'))
      listing.date = $(p).find('a').text()
    else {
      var pVal, pName = $(p).text().trim()

      var idx = pName.indexOf(':')
      if (idx == -1) { 
        pVal = pName
        pName = 'p' + i
      }
      else {
        pName = pName.substring(0, idx).trim()
        if (pName.charAt(0) == '#') 
          pName = ('Number of' + pName.substring(1))
        pVal = $(p).find('b');
      }
      
      listing[pName] = pVal
    }
  })

  return listing
}

Search.prototype.getRssListings = function(options, html) {
  var $ = cheerio.load(html)
  var listing = {}
  var listings = []
  var category = $('channel').find('title').text()
      
  $('item').each(function (i, element) {
    var children = $(element).children()

    debugger;
    var url = $(element).attr('rdf:about')
    var idx = url.lastIndexOf('/')
    var idx1 = url.indexOf('.', idx)
    var listing = { 
      category : category, 
      url: url, 
      pid: url.substring(idx + 1, idx1) 
    }

    for (var i=0; i<children.length; i++) {
      var t, child = children[i]
      var name = child.name
      
      if (name == 'title') {
        t = child.children[0].data.trim()
        if (t.indexOf('[CDATA[') != -1) 
          t = t.substring(7, t.length - 2).trim().replace(/^\&\#x0024\;/g, '').replace(/&\#x0024\;/g, '$')

        
        var priceIdx = t.indexOf('$')
        if (priceIdx != -1)  {
          var sidx = t.indexOf(' ', priceIdx)
          listing.price = sidx == -1 ? t.substring(priceIdx) : t.substring(priceIdx, sidx)
        }
        var idx = t.lastIndexOf('(')
          if (idx == -1) 
            listing.title = t
          else {
            var idx1 = t.indexOf(')', idx)
            listing.location = t.substring(idx + 1, idx1).trim()
            listing.title = t.substring(0, idx).trim()
          }

      }
      else if (name == 'description') {
        t = child.children[0].data.trim()
        if (t.indexOf('[CDATA[') != -1) 
          t = t.substring(7, t.length - 2)
        listing.description = t.replace(/&\#x0024\;/g, '$').trim()
      }
      else if (name == 'dc:date') 
        listing.date = $(child).text().trim()
      else if (name == 'enc:enclosure') {
        listing.hasPic = true
        listing.img = $(child).attr('resource')
      }
    }


        // coordinates : {
        //  lat : $(element).attr('data-latitude'),
        //  lon : $(element).attr('data-longitude')
        // },

      // make sure lat / lon is valid
      // if (typeof listing.coordinates.lat === 'undefined' ||
      //  typeof listing.coordinates.lon === 'undefined') {
      //  delete listing.coordinates;
      // }
    listings.push(listing);
  });

  return listings
}