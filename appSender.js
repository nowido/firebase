//--------------------------------------------------------------------------------------------

$(() => 
{    
    $('#buttonSend').click(() => 
    {
        var from = $('#myKey').val();
        var to = $('#alienKey').val();

        var fb = new FluidBridge(from, to);

        fb.listenPacketRemoved(() => 
        {
            alert('Transferred OK');
        }); 

        fb.post($('#messageText').val());        
    });
});

//--------------------------------------------------------------------------------------------
