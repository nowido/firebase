//--------------------------------------------------------------------------------------------

const funcChannelPrefix = 'func';
const taskChannelPrefix = 'task';
const resultChannelPrefix = 'result';

var appKey;

var funcChannel;
var taskChannel;
var resultChannel;

var newFunkRef;

var localWorker;

//--------------------------------------------------------------------------------------------

function WorkerProc()
{
    var started = false;

    onmessage = function(m)
    {
        var wrapper = m.data;

        if(wrapper.incoming)
        {
            if(OnRemoteResultReceived)
            {
                OnRemoteResultReceived(wrapper.incoming);
            }            
        }
        else if(wrapper.service)
        {
            if(wrapper.service.start && !started)
            {
                if(Main)
                {
                    Main(wrapper.service.appKey);
                }
                
                started = true;
            }
        }
    }
}

//--------------------------------------------------------------------------------------------

$(() => 
{
    /*
    firebase.initializeApp
    ({
        apiKey: 'AIzaSyAd420fTum26q2xJOjK-Do8eSaOpZ_hNLw',        
        databaseURL: "https://fluidbridge.firebaseio.com"
    });
    */
    var comm = new PubNub
    ({
        publishKey: 'pub-c-d96dbe02-77ff-47ee-b817-aaeecc7ad07c',
        subscribeKey: 'sub-c-f50821cc-43ab-11e7-b66e-0619f8945a4f',        
        ssl: true
    });   
    
    function onCommMessage(m)
    {   
        if(localWorker)
        {
            localWorker.postMessage({incoming: m.message});
        }
    }

    comm.addListener({message: onCommMessage});

    const appKeyElement = $('#appKey');

    const codeToSendElement = $('#codeToSend');
    const codeLocalElement = $('#codeLocal');

    codeToSendElement.prop('wrap', 'off');
    codeLocalElement.prop('wrap', 'off');

    const buttonSend = $('#buttonSend');
    const buttonStartRemoteTask = $('#buttonStartRemoteTask');

    const buttonTerminateFunction = $('#buttonTerminateFunction');

    function returnToInitialState()
    {
        comm.unsubscribe({channels: [resultChannel]});

        if(localWorker)
        {
            localWorker.terminate();
            localWorker = undefined;
        }

        buttonSend.prop('disabled', false);

        buttonStartRemoteTask.prop('disabled', true);
        buttonTerminateFunction.prop('disabled', true);
    }

    buttonSend.click(() => 
    {
        appKey = appKeyElement.val();

        funcChannel = funcChannelPrefix + appKey;
        taskChannel = taskChannelPrefix + appKey;
        resultChannel = resultChannelPrefix + appKey;
        
        newFunkRef = firebase.database().ref(appKey + '/functions').push(codeToSendElement.val(), (error) => 
        {
            if(!error)
            {                
                comm.subscribe({channels: [resultChannel], withPresence: false});

                comm.publish
                ({
                    message: {func: newFunkRef.key}, 
                    channel: funcChannel, 
                    storeInHistory: false,
                    sendByPost: true
                });                        
                
                buttonStartRemoteTask.prop('disabled', false);
                buttonTerminateFunction.prop('disabled', false);
            }
            else
            {
                returnToInitialState();
            }
        });

        buttonSend.prop('disabled', true);
    });

    function onMessageFromLocalWorker(m)
    {
        comm.publish
        ({
            message: m.data, 
            channel: taskChannel, 
            storeInHistory: false,
            sendByPost: true
        });        
    }

    function onLocalWorkerError(e)
    {
        console.log(e.message);                

        localWorker.terminate();

        localWorker = undefined;

        buttonStartRemoteTask.prop('disabled', false);
    }

    buttonStartRemoteTask.click(() => 
    {
        var code = codeLocalElement.val();

        if(code.length > 0)
        {
            var workerCodeURL = URL.createObjectURL(new Blob([code, '(' + WorkerProc.toString() + ')()'], {type : 'text/javascript'})); 
            
            var status = true;

            try
            {
                localWorker = new Worker(workerCodeURL);

                localWorker.onmessage = onMessageFromLocalWorker;
                localWorker.onerror = onLocalWorkerError;

                localWorker.postMessage({service: {start: true, appKey: appKey}});
            }
            catch(e)
            {
                status = false;
            }    
            
            URL.revokeObjectURL(workerCodeURL);  
            
            if(status)
            {
                buttonStartRemoteTask.prop('disabled', true);
            }
        }
    });

    buttonTerminateFunction.click(() => 
    {
        firebase.database().ref(appKey + '/functions/' + newFunkRef.key).remove();

        returnToInitialState();
    });
});

//--------------------------------------------------------------------------------------------
