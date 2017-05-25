//--------------------------------------------------------------------------------------------

$(() => 
{    
    $('#buttonListen').click(() => 
    {
        var from = $('#alienKey').val();
        var to = $('#myKey').val();

        var fb = new FluidBridge(from, to);

        fb.listenIncomingPackets((content) => 
        {                        
            alert('Received: ' + content);
            fb.removePacket();            
        });  

        $('#buttonListen').prop('disabled', true);       
    });
});

//--------------------------------------------------------------------------------------------
