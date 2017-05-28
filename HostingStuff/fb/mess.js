//--------------------------------------------------------------------------------------------

function sendContent(communicator, content)
{
    if(content.length > 0)
    {
        communicator.post(content); 
    }    
}

//--------------------------------------------------------------------------------------------

$(() => 
{
    var myFbKeyElement = $('#myFbKey');
    var alienFbKeyElement = $('#alienFbKey');

    var buttonStartElement = $('#buttonStart');

    var textToSendElement = $('#textToSend');
    
    var buttonSendElement = $('#buttonSend');

    var talkElement = $('#talk');

    var alien;
    var me;
    
    var fbFromMeToAlien;
    var fbToMeFromAlien;

    buttonStartElement.click(() => 
    {
        me = myFbKeyElement.val();
        alien = alienFbKeyElement.val();
        
        fbFromMeToAlien = new FluidBridge(me, alien);
        fbToMeFromAlien = new FluidBridge(alien, me);

        fbToMeFromAlien.onPacketOn((content) => 
        {                        
            talkElement.val(talkElement.val() + alien + ': ' + content + '\n');            

            talkElement.scrollTop(talkElement[0].scrollHeight);            
        });
        
        fbFromMeToAlien.onPacketOff(() => 
        {                        
            var textToSend = textToSendElement.val();

            if(textToSend.length > 0)
            {
                talkElement.val(talkElement.val() + me + ': ' + textToSend + '\n');
                
                talkElement.scrollTop(talkElement[0].scrollHeight);

                textToSendElement.val('');
            }
        }); 

        fbToMeFromAlien.listenPackets();
        fbFromMeToAlien.listenPackets();

        myFbKeyElement.prop('disabled', true);
        alienFbKeyElement.prop('disabled', true);       

        buttonStartElement.prop('disabled', true);       
        buttonSendElement.prop('disabled', false);     

        document.title = 'Fluid Bridge (' + me + ')';  
    });

    buttonSendElement.click(() => 
    {
        sendContent(fbFromMeToAlien, textToSendElement.val());        
    });    

    textToSendElement.on('keydown', (e) => 
    {
        if(e.originalEvent.code === "Enter")
        {
            sendContent(fbFromMeToAlien, textToSendElement.val());
        }        
    });
});

//--------------------------------------------------------------------------------------------