//--------------------------------------------------------------------------------------------

$(() => 
{
    var sinkFbKeyElement = $('#sinkFbKey');

    var buttonListenElement = $('#buttonListen');

    var messagesElement = $('#messages');

    var sinkKey;
    
    var fsink;

    buttonListenElement.click(() => 
    {
        sinkKey = sinkFbKeyElement.val();
        
        fsink = new FluidSink(sinkKey);

        fsink.onPacketOn((content) => 
        {                        
            messagesElement.val(messagesElement.val() + content + '\n');            

            messagesElement.scrollTop(messagesElement[0].scrollHeight);            
        });
        
        fsink.listenPackets();
        
        sinkFbKeyElement.prop('disabled', true);
        
        buttonListenElement.prop('disabled', true);       

        document.title = 'Fluid Sink (' + sinkKey + ')';  
    });
});

//--------------------------------------------------------------------------------------------
