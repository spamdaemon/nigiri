describe("openDBRequest tests", function() {
    // set up the async spec
    var async = new AsyncSpec(this);
    var setup = new db_setup();

    async.beforeEach(setup.setup());
    async.afterEach(setup.teardown());

    it("Test me", function() {
        expect(setup.db).not.toBe(null);
    });
});
