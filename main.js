// USAGE node main [city/www(for all cities)] [category] [start record] [hasPic]

var qc = require('./')

var city = process.argv[2]
if (!city)
  throw new Error('No city')
var category = process.argv[3]
if (!category)
  throw new Error('No category')

var offset = process.argv[4]
var hasPic = process.argv[5]

var options = {city: city, category: category}
if (city == 'www')
  options.isSites = true 	
if (offset)
  options.s = offset
if (hasPic  &&  (hasPic == '1' || hasPic == 'true'))
  options.hasPic = 1

 qc(options)
