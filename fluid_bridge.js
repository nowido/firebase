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

        fbToMeFromAlien.onPacketOn((content) => 
        {                        
            var currentTalk = $('#talk').val();

            $('#talk').val(currentTalk + '\n' + alien + ': ' + content);

            fbToMeFromAlien.removePacket();            
        });

        fbToMeFromAlien.listenPackets();
        /*
        fbToMeFromAlien.listenIncomingPackets((content) => 
        {                        
            var currentTalk = $('#talk').val();

            $('#talk').val(currentTalk + '\n' + alien + ': ' + content);

            fbToMeFromAlien.removePacket();            
        });  
        */
        $('#buttonStart').prop('disabled', true);       
        $('#buttonPost').prop('disabled', false);     

        document.title = 'Fluid Bridge (' + me + ')';  
    });

    $('#buttonPost').click(() => 
    {
        var textToPost = $('#textToPost').val();

        fbFromMeToAlien.onPacketOff(() => 
        {
            var currentTalk = $('#talk').val();

            $('#talk').val(currentTalk + '\n' + me + ': ' + textToPost);

            $('#textToPost').val('');
        }); 

        fbFromMeToAlien.listenPackets();
        /*
        fbFromMeToAlien.listenPacketRemoved(() => 
        {
            var currentTalk = $('#talk').val();

            $('#talk').val(currentTalk + '\n' + me + ': ' + textToPost);

            $('#textToPost').val('');
        });
        */
        fbFromMeToAlien.post(textToPost); 
    });
});

//--------------------------------------------------------------------------------------------
