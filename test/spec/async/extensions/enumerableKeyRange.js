describe("enumerable key range", function() {

    var next = function(x) {
        return x + 1;
    };
    var pred = function(x) {
        return x - 1;
    };

    it("should get the next value", zone.inject([ "nigiri.Nigiri" ], function(Nigiri) {
        var ks = new Nigiri.EnumerableKeyRange(0, 5,pred,next);
        expect(ks.next(2)).toBe(3);
    }));

    it("should get the previous value", zone.inject([ "nigiri.Nigiri" ], function(Nigiri) {
        var ks = new Nigiri.EnumerableKeyRange(0, 5,pred,next);
        expect(ks.pred(3)).toBe(2);
    }));
    
    it("should find the ceiling for a value", zone.inject([ "nigiri.Nigiri" ], function(Nigiri) {
        var ks = new Nigiri.EnumerableKeyRange(0, 5,pred,next);
        expect(ks.ceiling(-1)).toBe(0);
        expect(ks.ceiling(2)).toBe(2);
        expect(ks.ceiling(5)).toBe(5);
        expect(ks.ceiling(6)).toBeUndefined();
    }));

    it("should find the floor for a value", zone.inject([ "nigiri.Nigiri" ], function(Nigiri) {

        var ks = new Nigiri.EnumerableKeyRange(0, 5,pred,next);
        expect(ks.floor(-1)).toBeUndefined();
        expect(ks.floor(2)).toBe(2);
        expect(ks.floor(5)).toBe(5);
        expect(ks.floor(6)).toBe(5);
    }));

    it("should contain a value", zone.inject([ "nigiri.Nigiri" ], function(Nigiri) {
        var ks = new Nigiri.EnumerableKeyRange(0, 5,pred,next);
        expect(ks.contains(-1)).toBe(false);
        expect(ks.contains(0)).toBe(true);
        expect(ks.contains(2)).toBe(true);
        expect(ks.contains(5)).toBe(true);
        expect(ks.contains(6)).toBe(false);
    }));

});
