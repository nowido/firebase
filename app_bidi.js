//--------------------------------------------------------------------------------------------

$(() => 
{    
    var alien;
    var me;
    
    var fbFromMeToAlien;
    var fbToMeFromAlien;

    $('#buttonStart').click(() => 
    {
        alien = $('#alienKey').val();
        me = $('#myKey').val();

        fbFromMeToAlien = new FluidBridge(me, alien);
        fbToMeFromAlien = new FluidBridge(alien, me);

        fbToMeFromAlien.listenIncomingPackets((content) => 
        {                        
            var currentTalk = $('#talk').val();

            $('#talk').val(currentTalk + '\n' + alien + ': ' + content);

            fbToMeFromAlien.removePacket();            
        });  

        $('#buttonStart').prop('disabled', true);       
        $('#buttonPost').prop('disabled', false);     

        document.title = 'Fluid Bridge (' + me + ')';  
    });

    $('#buttonPost').click(() => 
    {
        var textToPost = $('#textToPost').val();

        fbFromMeToAlien.listenPacketRemoved(() => 
        {
            var currentTalk = $('#talk').val();

            $('#talk').val(currentTalk + '\n' + me + ': ' + textToPost);

            $('#textToPost').val('');
        });

        fbFromMeToAlien.post(textToPost); 
    });
});

//--------------------------------------------------------------------------------------------
