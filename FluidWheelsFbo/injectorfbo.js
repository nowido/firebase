//--------------------------------------------------------------------------------------------

var appKey;

const DISPATCHER_WORKER_URL = 'injector.js';

var dispatcherWorker;

const STATUS_WAITING_FUNCTION = 1;
const STATUS_FUNCTION_PUBLISHED = 2;
const STATUS_ACTIVE = 3;

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

    function returnToInitialState()
    {
        terminateDispatcherWorker();

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
            if(dispatcherWorker === undefined)
            {
                startDispatcherWorker();
            }

            if(dispatcherWorker !== undefined)
            {
                dispatcherWorker.postMessage({service: true, codeToSend: codeToSend});
            }            
        }
    });

    buttonStartRemoteTask.click(() => 
    {
        var codeLocal = codeLocalElement.val();

        if(codeLocal && (codeLocal.length > 0))
        {
            dispatcherWorker.postMessage({service: true, codeLocal: codeLocal});
        }        
    });

    buttonTerminateFunction.click(() => 
    {
        dispatcherWorker.postMessage({service: true, closeFunction: true});
    });

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

        const status = wrapper.status;

        if(wrapper.service)
        {
            if(status === STATUS_WAITING_FUNCTION)
            {
                buttonSend.prop('disabled', false);

                buttonStartRemoteTask.prop('disabled', true);
                buttonTerminateFunction.prop('disabled', true);                
            }
            else if(status === STATUS_FUNCTION_PUBLISHED)
            {
                buttonSend.prop('disabled', true);

                buttonStartRemoteTask.prop('disabled', false);
                buttonTerminateFunction.prop('disabled', false);                
            }    
            else if(status === STATUS_ACTIVE)
            {
                buttonStartRemoteTask.prop('disabled', true);                
            }  
        }
    }

    function onDispatcherWorkerError(e)
    {
        console.log(e.message);                

        returnToInitialState();
    }

});

//--------------------------------------------------------------------------------------------
