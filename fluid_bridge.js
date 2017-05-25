//--------------------------------------------------------------------------------------------

function FluidBridge(idFrom, idTo)
{
    this.base = firebase.database();

    this.idFrom = idFrom;
    this.idTo = idTo;

    this.key = idFrom + '-' + idTo;
}

//--------------------------------------------------------------------------------------------

FluidBridge.prototype.checkBridgeState = function(handler)
{
    this.base.ref().orderByKey().equalTo(this.key).once('value', (snapshot) => 
    {        
        handler(snapshot.val());
    });
}

//--------------------------------------------------------------------------------------------

FluidBridge.prototype.listenIncomingPackets = function(handler)
{
    var query = this.base.ref().orderByKey().equalTo(this.key);

    query.on('child_added', (snapshot) => 
    {        
        handler(snapshot.val());
    });

    return query;
}

//--------------------------------------------------------------------------------------------

FluidBridge.prototype.listenPacketRemoved = function(handler)
{
    this.base.ref().orderByKey().equalTo(this.key).once('child_removed', (snapshot) => 
    {        
        handler();
    });
}

//--------------------------------------------------------------------------------------------

FluidBridge.prototype.post = function(value)
{
    this.base.ref(this.key).set(value);    
}

//--------------------------------------------------------------------------------------------

FluidBridge.prototype.removePacket = function()
{
    this.base.ref(this.key).remove();    
}

//--------------------------------------------------------------------------------------------

