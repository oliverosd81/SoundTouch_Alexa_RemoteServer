module.exports = function(Home) {
    Home.shiftStack = function(bridgeID, cb) {
        Home.findById(bridgeID, function(err, instance){
            if(err) {
                console.log(err.name);
                console.log(err.message);
                return cb(null, err.message);
            }
            if(!instance) {
                console.log("Home not found for shiftStack:", bridgeID);
                return cb(null, "Home not found");
            }
            var instanceJS = JSON.parse(JSON.stringify(instance));
            if(instance.keyStack && instance.keyStack.length > 0){
                instanceJS.keyStack.shift();
                instance.updateAttribute('keyStack', instanceJS.keyStack, function(err, updatedInstance){
                    if(err) {
                        console.log(err.name);
                        console.log(err.message);
                        return cb(null, err.message);
                    }
                    cb(null, "shifted.");
                });
            } else {
                cb(null, "nothing to shift.");
            }
        });
    };
    
    Home.remoteMethod(
        'shiftStack',
        {
            http: {path: '/shiftStack', verb: 'get'},
            accepts: {arg: 'bridgeID', type: 'string', http: { source: 'query' } },
            returns: {arg: 'name', type: 'string'}
        }
    );
    
    Home.pushKey = function(bridgeID, url, cb) {
        Home.findById(bridgeID, function(err, instance){
            if(err) {
                console.log(err.name);
                console.log(err.message);
                return cb(null, err.message);
            }
            if(!instance) {
                console.log("Home not found for pushKey:", bridgeID);
                return cb(null, "Home not found");
            }
            var instanceJS = JSON.parse(JSON.stringify(instance));
            if(!instanceJS.keyStack) {
                instanceJS.keyStack = [];
            }
            instanceJS.keyStack.push(url);
            instance.updateAttribute('keyStack', instanceJS.keyStack, function(err, updatedInstance){
                if(err) {
                    console.log(err.name);
                    console.log(err.message);
                    return cb(null, err.message);
                }
                cb(null, "pushed.");
            });
        });
    };
    
    Home.remoteMethod(
        'pushKey',
        {
            http: {path: '/pushKey', verb: 'get'},
            accepts: [{arg: 'bridgeID', type: 'string', http: { source: 'query' } },
                      {arg: 'url', type: 'string', http: { source: 'query' } }],
            returns: {arg: 'name', type: 'string'}
        }
    );
};