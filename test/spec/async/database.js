describe("database", function() {
    // set up the async spec
    var async = new AsyncSpec(this);
    var setup = new db_setup({
        name : "databasetest",
        version : 2
    });

    async.beforeEach(setup.setup());
    async.afterEach(setup.teardown());

    it("should have a name property", function() {
        expect(setup.db.name).toEqual("databasetest");
    });

    it("should have a version property", function() {
        expect(setup.db.version).toBe(2);
    });

    it("should have a objects  property", function() {
        expect(setup.db.objectStoreNames.contains("store")).toBe(true);
    });

});
