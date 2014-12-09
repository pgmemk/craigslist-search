// USAGE node main [city/www(for all cities)] [category] [start record] [hasPic]

var searchCraigslist = require('./')
var minimist = require('minimist')
var argv = minimist(process.argv.slice(2))

if (!argv.category) throw new Error('Missing required parameter:  category')

var options = {
  category: argv.category
}

if (argv.offset) 
  options.s = argv.offset

if (argv.city) 
  options.city = argv.city

if ('hasPic' in argv) 
  options.hasPic = argv.hasPic !== 'false' && argv.hasPic !== '0'

searchCraigslist(options)
