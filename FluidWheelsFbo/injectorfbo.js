//--------------------------------------------------------------------------------------------

var appKey;

var codeToSend;

const DISPATCHER_WORKER_URL = 'injector.js';

var dispatcherWorker;

const STATUS_FUNCTION_PUBLISHED = 1;

//--------------------------------------------------------------------------------------------

$(() => 
{

/////////// UI stuff

    const appKeyElement = $('#appKey');

    const codeToSendElement = $('#codeToSend');
    const codeLocalElement = $('#codeLocal');

    codeToSendElement.prop('wrap', 'off');
    codeLocalElement.prop('wrap', 'off');

    const buttonSend = $('#buttonSend');
    const buttonStartRemoteTask = $('#buttonStartRemoteTask');

    const buttonTerminateFunction = $('#buttonTerminateFunction');

    buttonSend.click(() => 
    {
        appKey = appKeyElement.val();

        codeToSend = codeToSendElement.val();

        if(codeToSend && (codeToSend.length > 0))
        {
            if(dispatcherWorker === undefined)
            {
                startDispatcherWorker();
            }

            dispatcherWorker.postMessage({service: true, codeToSend: codeToSend});            
        }
        
        /*
            transfer it to dispatcher worker file
        codeEntryRef = firebase.database().ref(appKey + '/functions').push(codeToSendElement.val(), (error) => 
        {
            if(!error)
            {   
                if(startDispatcherWorker())
                {
                    buttonStartRemoteTask.prop('disabled', false);
                    buttonTerminateFunction.prop('disabled', false);
                }     
                else
                {
                    closeFunctionEntry();                    
                }       
            }
            else
            {
                returnToInitialState();
            }
        });
        
        buttonSend.prop('disabled', true);        
        */
    });

    function returnToInitialState()
    {
        terminateDispatcherWorker();

        buttonSend.prop('disabled', false);

        buttonStartRemoteTask.prop('disabled', true);
        buttonTerminateFunction.prop('disabled', true);
    }

    function closeFunctionEntry()
    {
        firebase.database().ref(appKey + '/functions/' + codeEntryRef.key).remove();

        // remove also [appKey + '/instances/' + codeEntryRef.key] - channels for communication with client
        // (do not forget off listening on it)        
    }

/////////// dispatcher worker stuff

    function startDispatcherWorker()
    {
        var status;

        try
        {
            dispatcherWorker = new Worker(DISPATCHER_WORKER_URL);

            dispatcherWorker.onmessage = onDispatcherWorkerMessage;
            dispatcherWorker.onerror = onDispatcherWorkerError;

            dispatcherWorker.postMessage({service: true, appKey: appKey});

            status = true;
        }
        catch(e)
        {
            status = false;
        }

        return status;
    }

    function terminateDispatcherWorker()
    {
        if(dispatcherWorker)
        {
            dispatcherWorker.terminate();
            dispatcherWorker = undefined;
        }
    }

    function onDispatcherWorkerMessage(m)
    {   
        var wrapper = m.data;

        if(wrapper.service)
        {
            if(wrapper.status === STATUS_FUNCTION_PUBLISHED)
            {
                
            }      
        }
    }

    function onDispatcherWorkerError(e)
    {
        console.log(e.message);                

        returnToInitialState();
    }

//////////////////////////


    buttonStartRemoteTask.click(() => 
    {
        var code = codeLocalElement.val();

        if(code && (code.length > 0))
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
        firebase.database().ref(appKey + '/functions/' + codeEntryRef.key).remove();

        // remove also [appKey + '/instances/' + codeEntryRef.key] - channels for communication with client
        // (do not forget off listening on it)

        returnToInitialState();
    });
});

//--------------------------------------------------------------------------------------------
