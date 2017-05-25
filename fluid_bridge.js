//--------------------------------------------------------------------------------------------

function FluidBridge()
{
    this.base = firebase.database();
}

//--------------------------------------------------------------------------------------------

FluidBridge.prototype.checkBridgeState = function (key, handler)
{
    this.base.ref().orderByKey().equalTo(key).once('value', handler);
}

//--------------------------------------------------------------------------------------------

FluidBridge.prototype.listenBridgeOn = function (key, handler)
{
    var query = this.base.ref().orderByKey().equalTo(key);

    query.on('child_added', handler);

    return query;
}

//--------------------------------------------------------------------------------------------

FluidBridge.prototype.listenBridgeOff = function (key, handler)
{
    var query = this.base.ref().orderByKey().equalTo(key);

    query.once('child_removed', handler);

    return query;
}

//--------------------------------------------------------------------------------------------

FluidBridge.prototype.post = function (key, value)
{
    this.base.ref(key).set(value);    
}

//--------------------------------------------------------------------------------------------

FluidBridge.prototype.ack = function (key)
{
    this.base.ref(key).remove();    
}

//--------------------------------------------------------------------------------------------
