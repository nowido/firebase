//--------------------------------------------------------------------------------------------

function FluidBridge(idFrom, idTo)
{
    this.base = firebase.database();

    this.idFrom = idFrom;
    this.idTo = idTo;

    this.key = idFrom + '-' + idTo;

        // flag needed to ignore initial null value of the key entry
        // (we don't call onPacketOff handler for the first time)
        
    this.initialRoundDone = false;
}

//--------------------------------------------------------------------------------------------

FluidBridge.prototype.onPacketOn = function(handler)
{
    this.packetOnHandler = handler;
}

//--------------------------------------------------------------------------------------------

FluidBridge.prototype.onPacketOff = function(handler)
{
    this.packetOffHandler = handler;
}

//--------------------------------------------------------------------------------------------

FluidBridge.prototype.listenPackets = function()
{
    var entry = this;

    var query = entry.base.ref(entry.key);    

    query.on('value', (snapshot) => 
    {     
        var content = snapshot.val();

        if(content)
        {
            if(entry.packetOnHandler)
            {
                entry.packetOnHandler(content);    
            }    

            entry.removePacket();        
        }
        else if(entry.initialRoundDone)
        {
            if(entry.packetOffHandler)
            {
                entry.packetOffHandler();
            }                
        } 
        else
        {
            entry.initialRoundDone = true;
        }                           
    });

    return query;
}

//--------------------------------------------------------------------------------------------

FluidBridge.prototype.stopListenPackets = function(query)
{
    query.off('value');
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