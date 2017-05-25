//--------------------------------------------------------------------------------------------

$(() => 
{
    var fb = new FluidBridge();

    $('body').append('<p><label>Alien key: <input id="alienKey" type="text"></label><p><label>My key: <input id="myKey" type="text"></label><p><button id="buttonListen">Listen</button>');

    $('#buttonListen').click(() => 
    {
        var keyPair = $('#alienKey').val() + $('#myKey').val();

        fb.listenBridgeOn(keyPair, (snapshot) => 
        {            
            console.log('Received: ' + snapshot.val());

            fb.ack(keyPair);            
        });  

        $('#buttonListen').prop('disabled', true);       
    });
});

//--------------------------------------------------------------------------------------------