// USAGE node main [city/www(for all cities)] [category] [start record] [hasPic]

var qc = require('./')

var argv = require('minimist')(process.argv.slice(2))
qc(argv)
