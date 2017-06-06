//--------------------------------------------------------------------------------------------

var appKey;

var codeEntryRef;

var localWorker;

//--------------------------------------------------------------------------------------------

function WorkerProc()
{
    var started = false;

    onmessage = function(m)
    {
        var wrapper = m.data;

        if(wrapper.service)
        {
            if(wrapper.service.start && !started)
            {
                if(Main)
                {
                    Main(wrapper.service.appKey, wrapper.service.idInstance);
                }
                
                started = true;
            }
        }
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

/////////// UI stuff

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
        terminateLocalWorker();

        buttonSend.prop('disabled', false);

        buttonStartRemoteTask.prop('disabled', true);
        buttonTerminateFunction.prop('disabled', true);
    }

    buttonSend.click(() => 
    {
        appKey = appKeyElement.val();

        var codeToSend = codeToSendElement.val();

        if(appKey && (appKey.length > 0) && codeToSend && (codeToSend.length > 0))
        {            
            publishFunction(codeToSend, () => 
            {
                buttonSend.prop('disabled', true);

                buttonStartRemoteTask.prop('disabled', false);
                buttonTerminateFunction.prop('disabled', false);                                                
            });
        }
    });

    buttonStartRemoteTask.click(() => 
    {
        var codeLocal = codeLocalElement.val();

        if(codeLocal && (codeLocal.length > 0))
        {
            if(startLocalWorker(codeLocal))
            {
                buttonStartRemoteTask.prop('disabled', true);     
            }
        }        
    });

    buttonTerminateFunction.click(() => 
    {
        closeFunctionEntry();
        
        returnToInitialState();
    });

/////////// Firebase stuff

    function publishFunction(code, callbackOnPublished)
    {
        codeEntryRef = firebase.database().ref(appKey + '/functions').push(code, (error) => 
        {
            if(!error)
            {   
                callbackOnPublished();
            }
        });
    }

    function closeFunctionEntry()
    {
        if(codeEntryRef)
        {
            firebase.database().ref(appKey + '/instances/' + codeEntryRef.key).remove();
            firebase.database().ref(appKey + '/tasks/' + codeEntryRef.key).remove();
            firebase.database().ref(appKey + '/results/' + codeEntryRef.key).remove();
            
            codeEntryRef.remove();

            codeEntryRef = undefined;                
        }
    }

/////////// local worker stuff

    function onMessageFromLocalWorker(m)
    {
    }

    function onLocalWorkerError(e)
    {
        console.log(e.message);                

        returnToInitialState();
    }

    function startLocalWorker(code)
    {
        var status = true;

        var workerCodeURL = URL.createObjectURL(new Blob([code, '(' + WorkerProc.toString() + ')()'], {type : 'text/javascript'})); 

        try
        {
            localWorker = new Worker(workerCodeURL);

            localWorker.onmessage = onMessageFromLocalWorker;
            localWorker.onerror = onLocalWorkerError;

            localWorker.postMessage({service: {start: true, appKey: appKey, idInstance: codeEntryRef.key}});
        }
        catch(e)
        {
            status = false;
        }    

        URL.revokeObjectURL(workerCodeURL);

        return status;    
    }

    function terminateLocalWorker()
    {
        if(localWorker)
        {
            localWorker.terminate();
            localWorker = undefined;
        }
    }

});

//--------------------------------------------------------------------------------------------
