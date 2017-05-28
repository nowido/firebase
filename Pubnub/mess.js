//--------------------------------------------------------------------------------------------

$(() => 
{
    var comm = new PubNub
    ({
        publishKey: 'pub-c-d96dbe02-77ff-47ee-b817-aaeecc7ad07c',
        subscribeKey: 'sub-c-f50821cc-43ab-11e7-b66e-0619f8945a4f',        
        ssl: true
    });    
    
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
        
        fbFromMeToAlien = me + '#' + alien;
        fbToMeFromAlien = alien + '#' + me;

        function onMessage(m)
        {
            talkElement.val(talkElement.val() + alien + ': ' + m.message + '\n');            

            talkElement.scrollTop(talkElement[0].scrollHeight);            
        }

        comm.addListener({message: onMessage});

        comm.subscribe({channels: [fbToMeFromAlien], withPresence: false});

        myFbKeyElement.prop('disabled', true);
        alienFbKeyElement.prop('disabled', true);       

        buttonStartElement.prop('disabled', true);       
        buttonSendElement.prop('disabled', false);     

        document.title = 'Fluid Bridge (' + me + ')';  
    });

    function onSent(status, response)
    {
        if(!status.error)
        {
            var textToSend = textToSendElement.val();

            talkElement.val(talkElement.val() + me + ': ' + textToSend + '\n');
            
            talkElement.scrollTop(talkElement[0].scrollHeight);

            textToSendElement.val('');
        }        
    }

    function sendContent(content)
    {
        if(content.length > 0)
        {
            comm.publish
            ({
                message: content, 
                channel: fbFromMeToAlien, 
                storeInHistory: false,
                sendByPost: true
            },
            onSent);
        }    
    }

    buttonSendElement.click(() => 
    {
        sendContent(textToSendElement.val());        
    });    

    textToSendElement.on('keydown', (e) => 
    {
        if(e.originalEvent.code === "Enter")
        {
            sendContent(textToSendElement.val());
        }        
    });
});

//--------------------------------------------------------------------------------------------