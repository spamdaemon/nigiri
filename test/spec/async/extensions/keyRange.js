describe("keyrange tests", function() {

    it("should find the ceiling for a value", zone.inject([ "nigiri.Nigiri" ], function(Nigiri) {

        var ks = Nigiri.KeyRange.bound(0, 5);
        expect(ks.ceiling(-1)).toBe(0);
        expect(ks.ceiling(2)).toBe(2);
        expect(ks.ceiling(5)).toBe(5);
        expect(ks.ceiling(6)).toBeUndefined();
    }));

    it("should find the ceiling for a value with open ends", zone.inject([ "nigiri.Nigiri" ], function(Nigiri) {

        var ks = Nigiri.KeyRange.bound(0, 5, true, true);
        expect(ks.ceiling(-1)).toBe(0);
        expect(ks.ceiling(0)).toBe(0);
        expect(ks.ceiling(2)).toBe(2);
        expect(ks.ceiling(5)).toBeUndefined();
    }));
    
    it("should find the floor for a value", zone.inject([ "nigiri.Nigiri" ], function(Nigiri) {

        var ks = Nigiri.KeyRange.bound(0, 5);
        expect(ks.floor(-1)).toBeUndefined();
        expect(ks.floor(2)).toBe(2);
        expect(ks.floor(5)).toBe(5);
        expect(ks.floor(6)).toBe(5);
    }));

    it("should find the floor for a value with open ends", zone.inject([ "nigiri.Nigiri" ], function(Nigiri) {

        var ks = Nigiri.KeyRange.bound(0, 5, true, true);
        expect(ks.floor(-1)).toBeUndefined();
        expect(ks.floor(0)).toBe(undefined);
        expect(ks.floor(2)).toBe(2);
        expect(ks.floor(5)).toBe(5);
        expect(ks.floor(6)).toBe(5);
    }));
});
