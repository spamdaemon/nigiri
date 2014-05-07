describe("KeyPath", function() {

    it("should parse a keypath", zone.inject([ "nigiri.Nigiri" ], function(Nigiri) {

        var kp = new Nigiri.KeyPath("value0");
        expect(kp.paths[0]).toEqual("value0");
    }));

    it("should apply a keypath to an object", zone.inject([ "nigiri.Nigiri" ], function(Nigiri) {

        var kp = new Nigiri.KeyPath("value0");
        var v = kp.applyPath({
            value0 : "xxx"
        });
        expect(v[kp.paths[0]]).toEqual("xxx");
    }));

});