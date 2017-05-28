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
    var sinkFbKeyElement = $('#sinkFbKey');

    var buttonStartElement = $('#buttonStart');

    var textToCastElement = $('#textToCast');

    var buttonCastElement = $('#buttonCast');

    var my;
    var sinkKey;

    buttonStartElement.click(() => 
    {
        my = myFbKeyElement.val();
        sinkKey = sinkFbKeyElement.val();
        
        myFbKeyElement.prop('disabled', true);
        sinkFbKeyElement.prop('disabled', true);
        
        buttonStartElement.prop('disabled', true);       
        buttonCastElement.prop('disabled', false);       

        document.title = 'Fluid Cast (' + my + ' -> ' + sinkKey + ')';  
    });

    buttonCastElement.click(() => 
    {
        comm.publish
        ({
            message: my + ':' + textToCastElement.val(), 
            channel: sinkKey, 
            storeInHistory: false,
            sendByPost: true
        });

        textToCastElement.val('');
    });

    textToCastElement.on('keydown', (e) => 
    {
        if(e.originalEvent.code === "Enter")
        {
            comm.publish
            ({
                message: my + ':' + textToCastElement.val(), 
                channel: sinkKey, 
                storeInHistory: false,
                sendByPost: true
            });
            
            textToCastElement.val('');
        }        
    });    
});

//--------------------------------------------------------------------------------------------