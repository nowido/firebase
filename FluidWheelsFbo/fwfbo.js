//--------------------------------------------------------------------------------------------

const maxWorkers = 8;

var workersCount = 1;

var appKey;

const DISPATCHER_WORKER_URL = 'fw.js';

var dispatcherWorker;

const STATUS_WAITING_FUNCTION = 1;
const STATUS_ACTIVE = 2;

//--------------------------------------------------------------------------------------------

$(() => 
{    

/////////// UI stuff

    const buttonCountMinus = $('#buttonCountMinus');
    const buttonCountPlus = $('#buttonCountPlus');
    const countSelector = $('#countSelector');

    const appKeyElement = $('#appKey');

    const buttonReceiveFunction = $('#buttonReceiveFunction');

    const labelStatus = $('#labelStatus');

    const statusInactiveLabel = 'Inactive';
    const statusWaitingFunctionLabel = 'Waiting for function...'
    const statusActiveLabel = 'Active';

    labelStatus.text(statusInactiveLabel);

    const functionReceived = $('#functionReceived');

    functionReceived.prop('wrap', 'off');

    countSelector.val(workersCount);

    function onWorkersCountMinus()
    {
        var count = Math.floor(new Number(countSelector.val()).valueOf());

        if(isNaN(count))
        {
            count = 2;
        }

        --count;

        if(count < 1)
        {
            count = 1;
        }

        countSelector.val(count);     

        workersCount = count;
    }

    function onWorkersCountPlus()
    {
        var count = Math.floor(new Number(countSelector.val()).valueOf());

        if(isNaN(count))
        {
            count = 0;
        }

        ++count;

        if(count > maxWorkers)
        {
            count = maxWorkers;
        }   

        countSelector.val(count);     

        workersCount = count;
    }

    function onWorkersCountInput()
    {
        var count = Math.floor(new Number(countSelector.val()).valueOf());

        if(isNaN(count))
        {
            count = 1;
        }

        if(count < 1)
        {
            count = 1;
        }
        else if(count > maxWorkers)
        {
            count = maxWorkers;
        }   

        countSelector.val(count);     

        workersCount = count;
    }

    buttonCountMinus.click(onWorkersCountMinus);
    buttonCountPlus.click(onWorkersCountPlus);
    countSelector.on('change', onWorkersCountInput);

    function disableWorkersCountInput(disable)
    {
        buttonCountMinus.prop('disabled', disable);
        buttonCountPlus.prop('disabled', disable);
        countSelector.prop('disabled', disable);        
    }

    buttonReceiveFunction.click(() => 
    {
        appKey = appKeyElement.val();

        if(appKey && (appKey.length > 0))
        {
            if(startDispatcherWorker())
            {
                appKeyElement.prop('disabled', true);
                buttonReceiveFunction.prop('disabled', true);            
            }
        }
    });


    function returnToInitialState()
    {
        terminateDispatcherWorker();

        disableWorkersCountInput(false);

        appKeyElement.prop('disabled', false);
        buttonReceiveFunction.prop('disabled', false);

        labelStatus.text(statusInactiveLabel);

        functionReceived.val('');        
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

            dispatcherWorker.postMessage({service: true, appKey: appKey, workersCount: workersCount});

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
                labelStatus.text(statusWaitingFunctionLabel);
            }      
            else if(status === STATUS_ACTIVE)
            {
                labelStatus.text(statusActiveLabel);
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
