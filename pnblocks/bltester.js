//--------------------------------------------------------------------------------------------

$(() => 
{
    const processorsCount = 10;
    const stepsCount = 100000; // max for PubNub BLOCKS

    const comm = new PubNub
    ({
        publishKey: 'pub-c-d96dbe02-77ff-47ee-b817-aaeecc7ad07c',
        subscribeKey: 'sub-c-f50821cc-43ab-11e7-b66e-0619f8945a4f',        
        ssl: true
    });    

    const appKeyElement = $('#appKey');

    const buttonSendPing = $('#buttonSendPing');

    const pongsReceivedElement = $('#pongsReceived');

    var sum = 0;

    var responsesCount = 0;

    function onMessage(m)
    {
        ++responsesCount;

        var wrapper = m.message;

        console.log(m.message);

        sum += wrapper.piPart;

        if(responsesCount === processorsCount)
        {
            comm.unsubscribe({channels: ['result' + appKey]});

            var currentContent = pongsReceivedElement.val();    

            pongsReceivedElement.val(currentContent + sum +'\n');

            sum = 0;
            responsesCount = 0;

            buttonSendPing.prop('disabled', false);
        }

        pongsReceivedElement.scrollTop(pongsReceivedElement[0].scrollHeight);                        
    }

    comm.addListener({message: onMessage});
        
    buttonSendPing.click(() => 
    {
        var appKey = appKeyElement.val();
        
        if(appKey)
        {
            buttonSendPing.prop('disabled', true);

            sum = 0;
            responsesCount = 0;

            comm.subscribe({channels: ['result' + appKey], withPresence: false});

            for(var i = 0; i < processorsCount; ++i)
            {
                comm.fire
                ({
                    message: {count: stepsCount, start: i * stepsCount}, 
                    channel: appKey,                     
                    sendByPost: true
                });
            }
        }        
    }); 
});