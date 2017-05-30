//--------------------------------------------------------------------------------------------

$(() => 
{
    var comm = new PubNub
    ({
        publishKey: 'pub-c-d96dbe02-77ff-47ee-b817-aaeecc7ad07c',
        subscribeKey: 'sub-c-f50821cc-43ab-11e7-b66e-0619f8945a4f',        
        ssl: true
    });   

    var funcChannel = 'func-8fd51e6d-9cf5-480c-9578-fcf7f8cb18fa';
    var taskChannel = 'task-bb4f6831-fe85-478c-b8ff-857396f5f426';

    var buttonSendElement = $('#buttonSend');

    buttonSendElement.click(() => 
    {
        comm.publish
        ({
            message: {func: $('#codeToSend').val()}, 
            channel: funcChannel, 
            storeInHistory: false,
            sendByPost: true
        });        

        buttonSendElement.prop('disabled', true);
    });
});

//--------------------------------------------------------------------------------------------