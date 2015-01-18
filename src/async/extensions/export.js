zone("nigiri.extension").interceptor("nigiri.Nigiri", [ "MyKeyPath", "MyMultiKey", "MyKeySet", "MyEnumerableKeyRange", "MyQuery", "MyOptions" ],
        function(MyKeyPath, MyMultiKey, MyKeySet, MyEnumerableKeyRange, MyQuery, MyOptions) {
            "use strict"

            return function(NigiriFN) {
                var Nigiri = NigiriFN();
                Nigiri.KeyPath = MyKeyPath;
                Nigiri.KeySet = MyKeySet;
                Nigiri.MultiKey = MyMultiKey;
                Nigiri.EnumerableKeyRange = MyEnumerableKeyRange;
                Nigiri.Query = MyQuery;
                Nigiri.Options = MyOptions;

                return Nigiri;
            };
        });
