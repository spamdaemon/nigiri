describe("MultiKey tests", function() {

    var newRange = zone.inject([ "nigiri.Nigiri", "#lo", "#hi" ], function(nigiri, lo, hi) {
        var next = function(x) {
            if (lo <= x && x < hi) {
                return x + 1;
            }
            return undefined;
        };

        var pred = function(x) {
            if (lo < x && x <= hi) {
                return x - 1;
            }
            return undefined;
        };

        return new nigiri.EnumerableKeyRange(lo, hi, pred, next);
    });

    it("should create a proper multikey", zone.inject([ "nigiri.Nigiri" ], function(Nigiri) {

        var fn = function() {
            var keys = [ newRange(0, 10), new Nigiri.KeySet([ 0, 2, 4, 6, 8, 10  ]) ];
            return new Nigiri.MultiKey(keys);
        };
        
        expect(fn).not.toThrow();
        var ks = fn(); 

        expect(ks.lower).toEqual([ 0, 0 ]);
        expect(ks.upper).toEqual([ 10, 10 ]);
        expect(ks.upperOpen).toBe(false);
        expect(ks.lowerOpen).toBe(false);
     }));

    it("should be able to compare two complex keys", zone.inject([ "nigiri.Nigiri" ], function(Nigiri) {

        var fn = function() {
            var key1 = [ 0, 1 ];
            var key2 = [ 1, 2 ];
            return Nigiri.IndexedDB.cmp(key1, key2);
        };
        expect(fn).not.toThrow();
    }));

    it("should find the ceiling for a value", zone.inject([ "nigiri.Nigiri" ], function(Nigiri) {

        var keys = [ newRange(0, 10), new Nigiri.KeySet([ 0, 2, 4, 6, 8, 10 ]) ];

        var ks = new Nigiri.MultiKey(keys);
        expect(ks.ceiling([ -1, 0 ])).toEqual([ 0, 0 ]);
        expect(ks.ceiling([ -1, 1 ])).toEqual([ 0, 0 ]);
        expect(ks.ceiling([ 0, 11 ])).toEqual([ 1, 0 ]);
        expect(ks.ceiling([ 11, 0 ])).toBeUndefined();
    }));

    it("should find the floor for a value", zone.inject([ "nigiri.Nigiri" ], function(Nigiri) {

        var keys = [ newRange(0, 10), new Nigiri.KeySet([ 0, 2, 4, 6, 8, 10 ]) ];

        var ks = new Nigiri.MultiKey(keys);
        expect(ks.floor([ -1, 0 ])).toBeUndefined();
        expect(ks.floor([ 0, 1 ])).toEqual([ 0, 0 ]);
        expect(ks.floor([ 11, 1 ])).toEqual([ 10, 10 ]);
        expect(ks.floor([ 10, -1 ])).toEqual([ 9, 10 ]);
    }));

});
