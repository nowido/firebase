//--------------------------------------------------------------------------------------------

$(() => 
{
    var fb = new FluidBridge();

    $('body').append('<p><label>My key: <input id="myKey" type="text"></label><p><label>Alien key: <input id="alienKey" type="text"></label><p><button id="buttonSend">Send</button>');

    $('#buttonSend').click(() => 
    {
        var keyPair = $('#myKey').val() + $('#alienKey').val();

        fb.listenBridgeOff(keyPair, () => 
        {
            console.log('Transferred OK');
        }); 

        fb.post(keyPair, 'data packet');        
    });
});

//--------------------------------------------------------------------------------------------