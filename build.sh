#!/bin/sh

LIBS=`find libs -name \*.js`
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
