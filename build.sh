#!/bin/sh

LIBS="libs/zone.min.js libs/zone-modules.min.js"
SOURCES=`find src -name \*.js`

rm -f nigiri.js;
touch nigiri.js;
for f in $LIBS; do 
	cat $f >> nigiri.js;
done;

for f in $SOURCES; do 
	cat $f >> nigiri.js;
done;

# run tests
karma start --single-run --log-level debug
