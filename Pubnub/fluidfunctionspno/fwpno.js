//--------------------------------------------------------------------------------------------

function WorkerNode(comm, appKey, idInstance, workersCount, callbackOnError)
{
    this.comm = comm;

    this.appKey = appKey;

    this.callbackOnError = callbackOnError;

    this.idInstance = idInstance;

    this.workersCount = workersCount;

    this.workers = null;
}

WorkerNode.prototype.notifyHost = function(e)
{
    if(this.callbackOnError)
    {
        this.callbackOnError(e);
    }
}

WorkerNode.prototype.notifyLocalWorker = function(index, reason, message)
{
    if(this.workers)
    {
        var w = this.workers[index];

        if(w)
        {
            w.postMessage({service: true, reason: reason, message: message});
        }        
    }
}

WorkerNode.prototype.castIncomingMessageToWorkers = function(message)
{
    var workers = this.workers;

    if(workers)
    {        
        var count = workers.length;

        for(var i = 0; i < count; ++i)
        {
            workers[i].postMessage({incoming: true, message: message});
        }
    }    
}

WorkerNode.prototype.start = function(code)
{
    var entry = this;

    function WorkerProc()
    {
        var started = false;

        onmessage = function(m)
        {
            var wrapper = m.data;

            if(wrapper.localCast || wrapper.incoming)
            {
                if(MessagesProcessor)
                {
                    var msgOut = MessagesProcessor(wrapper);

                    if(msgOut)
                    {                        
                        postMessage(msgOut);
                    }            
                }
            }
            else if(wrapper.service)
            {
                if(wrapper.reason === 'start')
                {
                    if(!started)
                    {
                        if(Main)
                        {
                            Main(wrapper.message);    
                        }

                        started = true;
                    }
                }
                else
                {
                    if(OnServiceMessage)
                    {
                        OnServiceMessage(wrapper);
                    }
                }                
            }                
        }
    }

    function onWorkerMessage(m)
    {   
        var wrapper = m.data;

        if(wrapper.localCast)
        {
            var castTo = wrapper.localTo;

            if(castTo && Array.isArray(castTo))
            {
                var count = castTo.length;

                for(var i = 0; i < count; ++i)
                {
                    var index = Math.floor(castTo[i]);

                    if((index >= 0) && (index < entry.workers.length))
                    {
                        entry.workers[index].postMessage({localCast: true, message: wrapper.message});
                    }                    
                }
            }             
        }
        else if(wrapper.outgoing)
        {                       
            entry.comm.publish(wrapper.message);
        }
        else if(wrapper.service)
        {
            if(wrapper.reason === 'subscribe')
            {
                entry.comm.subscribe(wrapper.message);                
            }
            else if(wrapper.reason === 'unsubscribe')
            {
                entry.comm.unsubscribe(wrapper.message);
            }        
            else if(wrapper.reason === 'fire')
            {
                entry.comm.fire(wrapper.message);
            }                    
        }
    }

    var status = true;

    var workerCodeURL = URL.createObjectURL(new Blob([code, '(' + WorkerProc.toString() + ')()'], {type : 'text/javascript'})); 

    var instanceParameters = 
    {
        appKey: entry.appKey,
        workersCount: entry.workersCount,            
        idInstance: entry.idInstance        
    }; 

    entry.workers = [];

    for(var i = 0; i < entry.workersCount; ++i)
    {
        try
        {
            var w = new Worker(workerCodeURL);

            w.onmessage = onWorkerMessage;
            w.onerror = (e) => {entry.notifyHost(e)};

            instanceParameters.idWorker = i;

            entry.workers.push(w);
            
            entry.notifyLocalWorker(i, 'start', instanceParameters);            
        }
        catch(e)
        {
            status = false;

            entry.notifyHost(e);

            break;
        }    
    }

    URL.revokeObjectURL(workerCodeURL);

    if(!status)
    {
        entry.terminate();
    }

    return status;
}

WorkerNode.prototype.terminate = function()
{    
    this.comm.unsubscribeAll();

    var workers = this.workers;

    if(workers)
    {        
        var count = workers.length;

        for(var i = 0; i < count; ++i)
        {
            workers[i].terminate();
        }
        
        this.workers = null;
    }
}

//--------------------------------------------------------------------------------------------

$(() => 
{    
/////////// module global stuff

    var appKey;

    var ourFunctionChannel;

    var workersCount = 1;

    var workerNode;

    const comm = new PubNub
    ({
        subscribeKey: 'sub-c-f50821cc-43ab-11e7-b66e-0619f8945a4f',
        publishKey: 'pub-c-d96dbe02-77ff-47ee-b817-aaeecc7ad07c',
        ssl: true
    });

/////////// UI stuff

    // UI elements and state

    const buttonCountMinus = $('#buttonCountMinus');
    const buttonCountPlus = $('#buttonCountPlus');
    const countSelector = $('#countSelector');

    buttonCountMinus.click(onWorkersCountMinus);
    buttonCountPlus.click(onWorkersCountPlus);
    countSelector.on('change', onWorkersCountInput);

    const appKeyElement = $('#appKey');

    const buttonReceiveFunction = $('#buttonReceiveFunction');

    const labelStatus = $('#labelStatus');

    const statusInactiveLabel = 'Inactive';
    const statusWaitingFunctionLabel = 'Waiting for function...'
    const statusActiveLabel = 'Active';

    updateStatus(statusInactiveLabel);

    const functionReceived = $('#functionReceived');

    functionReceived.prop('wrap', 'off');

    countSelector.val(workersCount);

    const maxWorkers = 8;

    // UI controller

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

    function returnUIToWaitingState()
    {
        disableInputElements(true);
        
        updateStatus(statusWaitingFunctionLabel);

        updateCode('');    
    }

    function setUIToActiveState()
    {
        disableInputElements(true);
        
        updateStatus(statusActiveLabel);

        updateCode('');    
    }

    function disableInputElements(disable)
    {
        buttonCountMinus.prop('disabled', disable);
        buttonCountPlus.prop('disabled', disable);
        countSelector.prop('disabled', disable);    

        appKeyElement.prop('disabled', disable);

        buttonReceiveFunction.prop('disabled', disable);                          
    }

    function updateCode(code)
    {
        functionReceived.val(code);  
    }

    function updateStatus(labelText)
    {
        labelStatus.text(labelText);
    }

    buttonReceiveFunction.click(() => 
    {
        var key = appKeyElement.val();

        if(key && (key.length > 0))
        {            
            askForFunction(key);
        }
    });

/////////// Main Controller stuff    

    function askForFunction(argAppKey)
    {
        appKey = argAppKey;

        returnUIToWaitingState();

        ourFunctionChannel = Math.floor(Math.random() * 1000000) + '-' + comm.getUUID();

        const processorInfo = 
        {
            UUID: comm.getUUID(),
            workersCount: workersCount,            
            feedbackChannel: ourFunctionChannel
        };

        comm.subscribe({channels: [ourFunctionChannel]});

        comm.publish
        ({
            message: processorInfo,
            channel: 'getfunction-' + appKey,
            storeInHistory: true,
            sendByPost: true            
        });        
    }

    function startWorkerNode(argIdInstance, argCode)
    {
        workerNode = new WorkerNode(comm, appKey, argIdInstance, workersCount, onWorkerNodeError);

        if(workerNode.start(argCode))
        {
            setUIToActiveState();
        }        
    }

    function closeFunction()
    {
        if(workerNode)
        {
            workerNode.terminate();

            workerNode = undefined;
        }

        askForFunction(appKey);
    }

    function onWorkerNodeError(e)
    {
        console.log(e);

        closeFunction();        
    }

    comm.addListener
    ({
        message: (m) => 
        {   
            if(m.message.injectCode && m.message.code && !workerNode)
            {
                startWorkerNode(ourFunctionChannel, m.message.code);

                updateCode(m.message.code);
            }
            else if(m.message.terminate && workerNode)
            {
                closeFunction();    
            }
            else if(workerNode)
            {
                workerNode.castIncomingMessageToWorkers(m.message);
            }
        }
    });    
});

//--------------------------------------------------------------------------------------------
