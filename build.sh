#!/bin/sh

SOURCES="header.js"
SOURCES="$SOURCES utils.js" 
SOURCES="$SOURCES wrapper.js" 
SOURCES="$SOURCES event.js" 
SOURCES="$SOURCES eventTarget.js" 

# wrappers
SOURCES="$SOURCES async/keyRange.js" 
SOURCES="$SOURCES async/request.js" 
SOURCES="$SOURCES async/transaction.js"
SOURCES="$SOURCES async/database.js"
SOURCES="$SOURCES async/openDBRequest.js"
SOURCES="$SOURCES async/factory.js" 
SOURCES="$SOURCES async/cursor.js"
SOURCES="$SOURCES async/cursorWithValues.js"
SOURCES="$SOURCES async/cursors.js"
SOURCES="$SOURCES async/objectStore.js" 
SOURCES="$SOURCES async/index.js"
SOURCES="$SOURCES async/environment.js"

# the extension classes
SOURCES="$SOURCES async/extensions/keySet.js" 
SOURCES="$SOURCES async/extensions/keyPath.js" 
SOURCES="$SOURCES async/extensions/options.js" 
SOURCES="$SOURCES async/extensions/ranges.js" 
SOURCES="$SOURCES async/extensions/createGenericCursorRequest.js" 
SOURCES="$SOURCES async/extensions/createKeySetCursorRequest.js" 
SOURCES="$SOURCES async/extensions/countByCursor.js" 
SOURCES="$SOURCES async/extensions/updateByCursor.js" 
SOURCES="$SOURCES async/extensions/deleteByCursor.js" 
SOURCES="$SOURCES async/extensions/getByCursor.js" 
SOURCES="$SOURCES async/extensions/getKeyByCursor.js" 
SOURCES="$SOURCES async/extensions/addPutAll.js" 
SOURCES="$SOURCES async/extensions/getAllByCursor.js" 
SOURCES="$SOURCES async/extensions/getAllKeysByCursor.js" 
SOURCES="$SOURCES async/extensions/getAllPrimaryKeysByCursor.js" 
SOURCES="$SOURCES async/extensions/query.js" 
SOURCES="$SOURCES async/extensions/cursors.js" 

SOURCES="$SOURCES export.js" 



cat > nigiri.jss <<EOF
 (function(window) {
EOF

for f in $SOURCES; do 
	cat src/$f >> nigiri.jss;
done;

cat >> nigiri.jss <<EOF
 })(window);
EOF

rm -rf ${HOME}/.config/google-chrome/Default/IndexedDB/http_localhost_0.indexeddb.leveldb
rm -rf ${HOME}/.config/google-chrome/Default/IndexedDB/https_localhost_8080.indexeddb.leveldb

mv nigiri.jss nigiri.js

#./scripts/https-server.js 
#karma start
