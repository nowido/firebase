//--------------------------------------------------------------------------------------------

$(() => 
{
    var comm = new PubNub
    ({
        publishKey: 'pub-c-d96dbe02-77ff-47ee-b817-aaeecc7ad07c',
        subscribeKey: 'sub-c-f50821cc-43ab-11e7-b66e-0619f8945a4f',        
        ssl: true
    });    

    var sinkFbKeyElement = $('#sinkFbKey');

    var buttonListenElement = $('#buttonListen');

    var messagesElement = $('#messages');

    buttonListenElement.click(() => 
    {
        var sinkKey = sinkFbKeyElement.val();
        
        function onMessage(m)
        {
            messagesElement.val(messagesElement.val() + m.message + '\n');            

            messagesElement.scrollTop(messagesElement[0].scrollHeight);                        
        }

        comm.addListener({message: onMessage});
        
        comm.subscribe({channels: [sinkKey], withPresence: false});
        
        sinkFbKeyElement.prop('disabled', true);
        
        buttonListenElement.prop('disabled', true);       

        document.title = 'Fluid Sink (' + sinkKey + ')';  
    });
});

//--------------------------------------------------------------------------------------------