//--------------------------------------------------------------------------------------------

/*
function MessagesProcessor(msgIn, msgOut)
{    
    if(msgIn.task)
    {        
        msgOut.result = msgIn.task  + '!!!';        
    }            
}
*/
//--------------------------------------------------------------------------------------------

function WorkerProc()
{
    onmessage = function(m)
    {
        var msgIn = m.data;

        var msgOut = {idWorker: msgIn.idWorker};

        MessagesProcessor(msgIn, msgOut);

        postMessage(msgOut);
    }
}

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
    
    var idDevice = Math.floor(Math.random() * 1000000) + '-' + comm.getUUID();

    var funcChannel = 'func-8fd51e6d-9cf5-480c-9578-fcf7f8cb18fa';
    var taskChannel = 'task-bb4f6831-fe85-478c-b8ff-857396f5f426';
    var resultChannel = 'result-ad1e8dd9-b88c-4af0-b7be-5f9d5546d43f';

    var buttonStartElement1 = $('#buttonStart1');
    var buttonStartElement2 = $('#buttonStart2');
    var buttonStartElement4 = $('#buttonStart4');
    var buttonStartElement8 = $('#buttonStart8');

    function disableButtons(disabled)
    {
        buttonStartElement1.prop('disabled', disabled);
        buttonStartElement2.prop('disabled', disabled);
        buttonStartElement4.prop('disabled', disabled);
        buttonStartElement8.prop('disabled', disabled);
    }
        
    var workers;

    function onWorkerMessage(m)
    {
        var msg = m.data;

        msg.idDevice = idDevice;

        comm.publish
        ({
            message: {result: msg}, 
            channel: resultChannel, 
            storeInHistory: false,
            sendByPost: true
        });                        
    }

    function onWorkerError(m)
    {
        console.log('* ' + e.message);
        w.terminate();        
    }

    function injectFuncCode(code)
    {
        var workerCodeURL = URL.createObjectURL(new Blob([code, '(' + WorkerProc.toString() + ')()'], {type : 'text/javascript'})); 

        function createWorkers(count)
        {
            workers = [];

            for(var i = 0; i < count; ++i)
            {
                try
                {
                    var w = new Worker(workerCodeURL);

                    w.onmessage = onWorkerMessage;
                    w.onerror = onWorkerError;

                    workers.push(w);        
                }
                catch(e)
                {}    
            }

            URL.revokeObjectURL(workerCodeURL);        

            comm.subscribe({channels: [taskChannel], withPresence: false});                
        }
        
        buttonStartElement1.click(() => {createWorkers(1); disableButtons(true);});
        buttonStartElement2.click(() => {createWorkers(2); disableButtons(true);});
        buttonStartElement4.click(() => {createWorkers(4); disableButtons(true);});
        buttonStartElement8.click(() => {createWorkers(8); disableButtons(true);});
    }

    function onCommMessage(m)
    {   
        var msgBody = m.message;

        if(msgBody.func)
        {
            comm.unsubscribe({channels: [funcChannel]});        

            firebase.database().ref('functions/' + msgBody.func).on('value', (snapshot) => 
            {
                if(snapshot)
                {
                    disableButtons(false);
                    injectFuncCode(snapshot.val());                    
                }
            });
        }  
        else if(msgBody.task)
        {
            var count = workers.length;

            for(var i = 0; i < count; ++i)
            {
                workers[i].postMessage({idWorker: i, task: msgBody.task});
            }    
        }   
    }

    comm.addListener({message: onCommMessage});
    
    comm.subscribe({channels: [funcChannel], withPresence: false});
});

//--------------------------------------------------------------------------------------------
