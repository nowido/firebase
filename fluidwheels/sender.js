//--------------------------------------------------------------------------------------------

$(() => 
{
    firebase.initializeApp
    ({
        apiKey: 'AIzaSyAd420fTum26q2xJOjK-Do8eSaOpZ_hNLw',        
        databaseURL: "https://fluidbridge.firebaseio.com"
    });
    
    var comm = new PubNub
    ({
        publishKey: 'pub-c-d96dbe02-77ff-47ee-b817-aaeecc7ad07c',
        subscribeKey: 'sub-c-f50821cc-43ab-11e7-b66e-0619f8945a4f',        
        ssl: true
    });   
    
    function onCommMessage(m)
    {   
        var msgBody = m.message;

        console.log(msgBody.result);
    }

    comm.addListener({message: onCommMessage});

    var funcChannel = 'func-8fd51e6d-9cf5-480c-9578-fcf7f8cb18fa';
    var taskChannel = 'task-bb4f6831-fe85-478c-b8ff-857396f5f426';
    var resultChannel = 'result-ad1e8dd9-b88c-4af0-b7be-5f9d5546d43f';

    var buttonSendElement = $('#buttonSend');
    var buttonStartRemoteTaskElement = $('#buttonStartRemoteTask');

    buttonSendElement.click(() => 
    {
        var newFunkRef = firebase.database().ref('functions').push($('#codeToSend').val(), (error) => 
        {
            if(!error)
            {
                comm.publish
                ({
                    message: {func: newFunkRef.key}, 
                    channel: funcChannel, 
                    storeInHistory: false,
                    sendByPost: true
                });                        

                comm.subscribe({channels: [resultChannel], withPresence: false});

                buttonStartRemoteTaskElement.prop('disabled', false);
            }
        });

        buttonSendElement.prop('disabled', true);
    });

    buttonStartRemoteTaskElement.click(() => 
    {
        comm.publish
        ({
            message: {task: 'brand new task ' + Math.random()}, 
            channel: taskChannel, 
            storeInHistory: false,
            sendByPost: true
        });                                
    });
});

//--------------------------------------------------------------------------------------------
