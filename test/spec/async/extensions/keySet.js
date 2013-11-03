describe("KeyPath", function() {

    it("should find an item in a keyset",function() {
        
        var ks = new Nigiri.KeySet([0,1,2,3]);
        expect(ks.contains(2)).toBe(true);
        expect(ks.indexOf(2)).toBe(2);
    });

    it("should not find an item in a keyset that is not there",function() {
        
        var ks = new Nigiri.KeySet([0,1,3]);
        expect(ks.contains(2)).toBe(false);
        expect(ks.indexOf(2)).toBe(-1);
    });

});