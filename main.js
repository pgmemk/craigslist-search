// USAGE node main [city/www(for all cities)] [category] [start record] [hasPic]

var qc = require('./')

var argv = require('minimist')(process.argv.slice(2))

var citiesOnly = argv.citiesOnly
if (citiesOnly) {
  qc({citiesOnly: true})
  return
}

var all = argv.all
var city = argv.city
if (!city  &&  !all)
  throw new Error('No city')
var category = argv.category
if (!category)
  throw new Error('No category')
var offset = argv.offset
var hasPic = argv.hasPic
var query = argv.query

var options = {category: category};
if (all)
  options.allCities = true 	
if (city)
  options.city = city

if (offset)
  options.s = offset
if (hasPic  &&  (hasPic == '1' || hasPic == 'true'))
  options.hasPic = 1
if (query)
	options.query = query
 qc(options)
