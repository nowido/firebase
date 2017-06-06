//--------------------------------------------------------------------------------------------

var appKey;

var codeEntryRef;

var instancesRef;

var localWorker;

var readyProcessorsCount = 0;
var totalWorkersCount = 0;

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

    const readyProcessorsCountElement = $('#readyProcessorsCount');
    
    updateReadyProcessors();

    const buttonStartRemoteTask = $('#buttonStartRemoteTask');

    const buttonTerminateFunction = $('#buttonTerminateFunction');

    function updateReadyProcessors()
    {
        totalWorkersCount
        readyProcessorsCountElement.text
        (
            'Ready processors: ' + readyProcessorsCount + ' (total workers: ' + totalWorkersCount + ')'
        );
    }

    function addProcessor(processorInfo)
    {
        ++readyProcessorsCount;
        
        if(processorInfo.workersCount)
        {
            totalWorkersCount += processorInfo.workersCount;
        }
        else
        {
            ++totalWorkersCount;
        }

        updateReadyProcessors();
    }

    function removeProcessor(processorInfo)
    {
        --readyProcessorsCount;

        if(processorInfo.workersCount)
        {
            totalWorkersCount -= processorInfo.workersCount;
        }
        else
        {
            --totalWorkersCount;
        }

        if(readyProcessorsCount < 0)
        {
            readyProcessorsCount = 0;
        }

        if(totalWorkersCount < 0)
        {
            totalWorkersCount = 0;
        }

        updateReadyProcessors();
    }

    function returnToInitialState()
    {
        closeFunctionEntry();

        terminateLocalWorker();

        appKeyElement.prop('disabled', false);

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
                trackReadyProcessors();

                appKeyElement.prop('disabled', true);

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
        returnToInitialState();
    });

/////////// Firebase stuff

    function trackReadyProcessors()
    {        
        instancesRef = firebase.database().ref(appKey + '/instances/' + codeEntryRef.key);
        
        instancesRef.on('child_added', (snapshot) => 
        {                  
            addProcessor(snapshot.val());
        });    

        instancesRef.on('child_removed', (snapshot) => 
        {
            removeProcessor(snapshot.val());
        });            
    }

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
        readyProcessorsCount = 0;
        totalWorkersCount = 0;
        updateReadyProcessors();

        if(codeEntryRef)
        {
            if(instancesRef)
            {
                instancesRef.off('child_added');
                instancesRef.off('child_removed');
                instancesRef.remove();            
                instancesRef = undefined;
            }
            
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
