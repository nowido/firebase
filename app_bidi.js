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
        
        fbFromMeToAlien.onPacketOff(() => 
        {
            var currentTalk = $('#talk').val();

            $('#talk').val(currentTalk + '\n' + me + ': ' + $('#textToPost').val());

            $('#textToPost').val('');
        }); 

        fbToMeFromAlien.listenPackets();
        fbFromMeToAlien.listenPackets();

        $('#buttonStart').prop('disabled', true);       
        $('#buttonPost').prop('disabled', false);     

        document.title = 'Fluid Bridge (' + me + ')';  
    });

    $('#buttonPost').click(() => 
    {
        fbFromMeToAlien.post($('#textToPost').val()); 
    });
});

//--------------------------------------------------------------------------------------------
