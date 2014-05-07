Nigiri
======

This library wraps an IndexedDB datastore in order to provide additional capabilities.
Nirigi closely follows the design of the [IndexedDB API](http://www.w3.org/TR/IndexedDB/) through 
new functions for ObjectStore and Indexes and reinterpreting arguments for existing functions. 


Features
--------

Nigiri provides the ability to
* execute complex queries that automatically use available indexes
* define a cursor with a set of keys in addition to key ranges
* limit the size of a result set
* skip over the initial items in a result set
* filter a result set
* apply batch updates to the database
* use complex queries to delete, update, and count items in the database
* collect all values, primary keys, or keys that are enumerated by a query


Non-Features
------------

Notably absent from Nigiri are promises at this point. There are several methods of the IndexedDB API that don't lend 
themselves very easily to using promises.


TODO
----

This is the initial version of Nigiri and it is likely to have bugs:
* there is no build script other than a simple Unix bash script.
* the documentation is currently lacking
* the event interface has not been tested
* the code organization is still very rough and draft-like 
* only tested on Chrome and Firefox so far
* error handling for batch operations are not that well defined


Unit Testing
------------

Unit testing is supported by [Jasmine](http://pivotal.github.io/jasmine/)
and [Karma](http://karma-runner.github.io/0.10/index.html).


Contribute
----------

If you find this project useful and want to report a problem, please provide a unit test case.


Examples
--------
### EnumerableKey

TODO

### KeySet

Use a KeySet to find specific items in an index or a store. The KeySet can be used in the same way that an IDBKeyRange 
can be used:
```X.openCursor(new Nigiri.KeySet([ key1, key2, key3, ... ]))```

```X.openKeyCursor(new Nigiri.KeySet([ key1, key2, key3, ... ]))```

The keys must be specified in sorted order.

### MultiKey

Use a Multikey to find specific items in an index or store when the key is an array:
```X.openCursor(new Nigiri.MultiKey([ key1, key2, key3, ... ]))```

```X.openKeyCursor(new Nigiri.MultiKey([ key1, key2, key3, ... ]))```

Each key is itself a key range, but only EnumerableKeyRange instance must be used.

### Query

Use a Query to perform more complex object store queries involving multiple fields, which are identified by their keypath. 

```
  BOOKS.openCursor(new Nigiri.Query({
    author : new Nigiri.KeySet(["Hemingway", "Poe" ]),
    year   : Nigiri.KeyRange.bound(1900, 1950),
  }), options)
```
 If there are fields that are indexed, then the query will use the appropriate indexes. For fields that are not indexed,
 a filter is automatically created. Again, a query can be used with generic options.
Queries cannot be used with indexes. Use a KeyRange or KeySet instead.

### Options

Cursor functions that normally take a direction parameter can now take an Options parameter instead.

Currently, the supported options are
* `direction`, which can be used in the same way that the standard `direction` parameter would be used.
* `offset`, which can be used to skip an initial number of items that the cursor would normally return.
* `limit`, which can be used to limit the number of items returned by the cursor.
* `filter`, which is a boolean `function(cursor)` that can be used to ignore items that a cursor would normally return
* `withValues`, is used to indicate that the cursor needs to retrieve objects from the store instead of just their keys
* `includedKeys`, is used to limit the result set  or cursor to a list of included keys (must be a sorted array)
* `includedPrimaryKeys`, is used to limit the result set  or cursor to a list of primary keys  (must be a sorted array)
* `excludedKeys`, is used to exclude certain keys from a result set or cursor  (must be a sorted array)
* `excludedPrimaryKeys`,  is used to exclude certain primary keys from a result set or cursor  (must be a sorted array)
* `unique`,  is used to ensure that a primary key is only ever returned once (only useful for indexes that have multiple entries for a primary key)

The following cursor enumerates only the two even items 2,4 in reverse order: 
```
  INTEGERS.openCursor(new IDBKeyRange(0,100),new Nigiri.Options({ 
    offset : 3,
    limit : 2,
    direction : "prev",
    filter : function(cursor) {
      return (cursor.key % 2) === 0;
    }
  }))
```
 
### Counting, Getting, and Deleting

KeySet and and Query can be used together with the count and delete functions.
```
	BOOKS.count(new Nigiri.Query({
		year : Nigiri.KeyRange.upperBound(2011)
	});
``` 
might be used to count all books before the year 2012.

or 
```
	BOOKS["delete"](new Nigiri.Query({
    	year : Nigiri.KeyRange.upperBound(2010)
	}));
``` 
can be used to delete books older than 2011.

Analogous to delete and count, it is possible to use queries with the `get` and `getKey` functions
on an index or object store.

### Updating

Items in the database can easily be updated or deleted with an update function. For example,
use this to delete very old unread articles, or mark somewhat old articles as read:
```
  BOOKS.update(function(book) {
            if (book.year < 2009) {
                return undefined; // return undefined to delete the book
            }
            if ((now - book.year) < 1) {
                return null; // don't update this item
            }

            book.unread = false;
            return book; // return the item (or a new item) to update the entry in the database
        }, new Nigiri.Query({
            unread : true
        }), new Nigiri.Options())
```

### Batch Update operations

A few methods have been added to retrieve multiple records or update or add multiple records:
* addAll can be used to add multiple new items to the object store
* putAll can be used to add or overwrite existing items in the object store.

Example usage of addAll:
```
	BOOKS.addAll([ {
            key : "isbn:978-0596517748",
            title : "JavaScript : The Good Parts",
            author : "Crockford",
            year : 2008,
            unread : true
        }, {
            key : "B00CA5USBY8",
            title : "Javascript for Beginners",
            author : "Lassoff",
            year : 2013,
            unread : true
        }, {
            key : "isbn:978-1449399023",
            title : "JavaScript & jQuery: The Missing Manual",
            author : "McFarland",
            year : 2011,
            unread : true
        } ])
```

Basically, addAll and putAll work like their single value counterparts.

### Batch Retrieval
Batch retrieval methods simplify the use of the database since it avoids use of cursors:
* getAll can be used to get all objects that match a query on an index or a store
* getAllPrimaryKeys can be used to a sorted array of the primary keys that are selected by a query on an index or a store
* getAllKeys can be used to a sorted array of the keys that are selected by a query  on an index or a store

The result of the operations are arrays of either values, primary keys, or keys. They are used like this:
```
	 BOOKS.getAll(new Nigiri.Query({
            year : IDBKeyRange.upperBound(2012)
        }), new Nigiri.Options({
            direction : "prev"
        }))
```

All batch operations currently respond with a success event and report this structure as a result:
```
  {
     successes : <number of successful operations>,
     errors : <number of errors>
  }
```

If an onerror handler is set, then the all batch operations may invoke the handler multiple times, if the handler
calls ```preventDefault```.
  

Performance
-----------

Generally, the Nigiri.Queries should be performing reasonably well, unless non-indexed fields are queried. If non-indexed fields are queried, 
then the object has to be retrieved from storage so that the filter function can be evaluated. When using filters or keysets, the 
cursor's advance function cannot skip over multiple items at a time, so use of `cursor.advance()` with values greater than one should be
avoided. This applies also to initial offsets greather than 1.
