#!/bin/sh

LIBS=`find libs -name \*.js`
SOURCES=`find src -name \*.js`

rm -f nigiri.js.tmp;
touch nigiri.js.tmp;

for f in $LIBS; do 
	cat $f >> nigiri.js.tmp;
done;

for f in $SOURCES; do 
	cat $f >> nigiri.js.tmp;
done;


mv nigiri.js.tmp nigiri.js

