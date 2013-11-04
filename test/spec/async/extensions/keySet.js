describe("KeyPath", function() {

    it("should find an item in a keyset", function() {

        var ks = new Nigiri.KeySet([ 0, 1, 2, 3 ]);
        expect(ks.contains(2)).toBe(true);
        expect(ks.indexOf(2)).toBe(2);
    });

    it("should not find an item in a keyset that is not there", function() {

        var ks = new Nigiri.KeySet([ 0, 1, 3 ]);
        expect(ks.contains(2)).toBe(false);
        expect(ks.indexOf(2)).toBe(-1);
    });

    it("should intersect two keysets ", function() {

        var ks1 = new Nigiri.KeySet([ 0, 1, 3, 5 ]);
        var ks2 = new Nigiri.KeySet([ 0, 2, 3, 4, 5 ]);
        var ks = ks1.intersect(ks2);
        expect(ks.keys.length).toBe(3);
        expect(ks.keys[0]).toBe(0);
        expect(ks.keys[1]).toBe(3);
        expect(ks.keys[2]).toBe(5);
    });

    it("should merge two keysets ", function() {

        var ks1 = new Nigiri.KeySet([ 0, 1, 3, 5 ]);
        var ks2 = new Nigiri.KeySet([ 0, 2, 3, 4, 5 ]);
        var ks = ks1.merge(ks2);
        expect(ks.keys.length).toBe(6);
        expect(ks.keys[0]).toBe(0);
        expect(ks.keys[1]).toBe(1);
        expect(ks.keys[2]).toBe(2);
        expect(ks.keys[3]).toBe(3);
        expect(ks.keys[4]).toBe(4);
        expect(ks.keys[5]).toBe(5);
    });

});