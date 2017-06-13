//--------------------------------------------------------------------------------------------

function WorkerNode(instanceParameters)
{
    this.comm = instanceParameters.comm;

    this.appKey = instanceParameters.appKey;

    this.enumerationChannel = instanceParameters.enumerationChannel;

    this.callbackOnError = instanceParameters.callbackOnError;

    this.idInstance = Math.floor(Math.random() * 1000000) + '-' + this.comm.getUUID();

    this.workersCount = instanceParameters.workersCount;

    //

    this.processorInfo = 
    {        
        UUID: this.comm.getUUID(),
        workersCount: this.workersCount,            
        feedbackChannel: this.idInstance
    };

    this.workers = null;
}

WorkerNode.prototype.enumerateNode = function()
{   
    this.comm.subscribe({channels: [this.idInstance]}); 

    this.comm.publish
    ({
        message: this.processorInfo,
        channel: this.enumerationChannel,
        storeInHistory: false,
        sendByPost: true            
    });        
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

    const fetchChannel = 'fetchfunc-65b369b6-2551-4749-8a8c-1a85228261c1';

    var appKey;

    var updateFuncChannel;
    var ourFunctionChannel; 

    var randomToken;

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

    function setUIToActiveState(code)
    {
        disableInputElements(true);
        
        updateStatus(statusActiveLabel);

        updateCode(code);    
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

    function fetchFromBlock(feedbackChannel)
    {
        var request = {appKey: appKey, feedbackChannel: feedbackChannel};

        comm.fire
        ({
            message: request,
            channel: fetchChannel,
            sendByPost: true
        });        
    }

    function askForFunction(argAppKey)
    {
        appKey = argAppKey;

        updateFuncChannel = 'updatefunc-' + appKey;
        ourFunctionChannel = Math.floor(Math.random() * 1000000) + '-fetchfunc-' + comm.getUUID();

        comm.subscribe({channels: [updateFuncChannel, ourFunctionChannel]});

        fetchFromBlock(ourFunctionChannel);        

        returnUIToWaitingState();   
    }

    function askForFunctionUpdate()
    {        
        comm.subscribe({channels: [updateFuncChannel]});

        returnUIToWaitingState();   
    }

    function startWorkerNode(argCode)
    {
        const instanceParameters = 
        {
            comm: comm,
            appKey: appKey,
            enumerationChannel: 'enumeration-' + randomToken + '-' + appKey,            
            workersCount: workersCount,
            callbackOnError: onWorkerNodeError
        };

        workerNode = new WorkerNode(instanceParameters);

        if(workerNode.start(argCode))
        {
            workerNode.enumerateNode();

            setUIToActiveState(argCode);
        }     
    }

    function closeFunction()
    {
        randomToken = undefined;

        if(workerNode)
        {
            workerNode.terminate();

            workerNode = undefined;
        }

        askForFunctionUpdate();
    }

    function onWorkerNodeError(e)
    {
        console.log(e);

        closeFunction();        
    }

    function onFunctionChannels(message)
    {
        if(message)
        {
            const code = message.code;
            
            if(code && (code.length > 0))
            {
                if(workerNode)
                {
                    if(randomToken !== message.randomToken)
                    {
                        randomToken = message.randomToken;

                        workerNode.terminate();

                        comm.subscribe({channels: [updateFuncChannel]});
                        
                        startWorkerNode(code);                        
                    }                                        
                }
                else
                {
                    randomToken = message.randomToken;

                    startWorkerNode(code);
                }
            }
            else if(workerNode)
            {
                closeFunction();
            }
        }
        else if(workerNode)
        {            
            closeFunction();
        }            
    }

    comm.addListener
    ({
        message: (m) => 
        {   
            if((m.channel === ourFunctionChannel) || (m.channel === updateFuncChannel))
            {
                onFunctionChannels(m.message)
            }
            else if(workerNode)
            {
                workerNode.castIncomingMessageToWorkers(m.message);
            }
        }
    });    
});

//--------------------------------------------------------------------------------------------
