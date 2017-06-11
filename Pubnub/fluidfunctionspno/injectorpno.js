//--------------------------------------------------------------------------------------------

function MasterNode(comm, appKey, callbackOnError, callbackOnOutput)
{    
    this.comm = comm;

    this.appKey = appKey;

    this.callbackOnError = callbackOnError;
    this.callbackOnOutput = callbackOnOutput;

    this.idInstance = Math.floor(Math.random() * 1000000) + '-' + comm.getUUID();

    this.localWorker = null;

    this.workerNodes = {};
}

MasterNode.prototype.notifyHost = function(e)
{
    if(this.callbackOnError)
    {
        this.callbackOnError(e);
    }
}

MasterNode.prototype.notifyLocalWorker = function(reason, message)
{
    if(this.localWorker)
    {
        this.localWorker.postMessage({service: true, reason: reason, message: message});
    }
}

MasterNode.prototype.addWorkerNode = function(workerNode)
{
    this.workerNodes[workerNode.UUID] = workerNode;

    this.notifyLocalWorker('add', workerNode);
}

MasterNode.prototype.removeWorkerNode = function(UUID)
{
    delete this.workerNodes[UUID];

    this.notifyLocalWorker('remove', workerNode);
}

MasterNode.prototype.start = function(localCode)
{
    var entry = this;

    function onMessageFromLocalWorker(m)
    {
        const wrapper = m.data;

        if(wrapper.outgoing)
        {
            entry.comm.publish(wrapper.message);
        }
        else if(wrapper.service)
        {
            if(wrapper.reason === 'output')
            {
                if(entry.callbackOnOutput)
                {
                    entry.callbackOnOutput(wrapper.message);
                }                
            }
            else if(wrapper.reason === 'subscribe')
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

    function WorkerProc()
    {
        var started = false;
        
        onmessage = function(m)
        {
            const wrapper = m.data;

            if(wrapper.incoming)
            {
                if(OnIncomingMessage)
                {
                    OnIncomingMessage(wrapper.message);
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

    var status = true;

    var workerCodeURL = URL.createObjectURL(new Blob([localCode, '(' + WorkerProc.toString() + ')()'], {type : 'text/javascript'})); 

    try
    {
        entry.localWorker = new Worker(workerCodeURL);

        entry.localWorker.onmessage = onMessageFromLocalWorker;
        entry.localWorker.onerror = (e) => {entry.notifyHost(e)};
    }
    catch(e)
    {
        entry.notifyHost(e);

        status = false;
    }    

    URL.revokeObjectURL(workerCodeURL);

    if(status)
    {
        var instanceParameters = 
        {
            appKey: entry.appKey,                 
            idInstance: entry.idInstance,
            remoteProcessors: entry.workerNodes
        }; 
        
        entry.notifyLocalWorker('start', instanceParameters);
    }
    
    return status;
}

MasterNode.prototype.terminate = function()
{    
    this.comm.unsubscribeAll();

    if(this.localWorker)
    {        
        this.localWorker.terminate();

        this.localWorker = null;
    }

    var keys = Object.keys(this.workerNodes);

    var count = keys.length;

    for(var i = 0; i < count; ++i)
    {
        var proc = this.workerNodes[keys[i]];

        var publishParameters = 
        {
            message: {terminate: true},
            channel: proc.feedbackChannel,
            storeInHistory: false,
            sendByPost: true
        };

        this.comm.publish(publishParameters);
    }    
}

MasterNode.prototype.processIncomingMessage = function(m)
{
    if(this.localWorker)
    {
        this.localWorker.postMessage({incoming: true, message: m});
    }    
}

//--------------------------------------------------------------------------------------------

$(() => 
{
/////////// module global stuff

    const injectorChannel = 'injectfunc-d9e7c7cf-b5c9-434a-beb9-4a1b8868bab5';

    var appKey;

    var enumerationChannel;

    var readyProcessorsCount = 0;
    var totalWorkersCount = 0;

    var masterNode;

    const comm = new PubNub
    ({
        subscribeKey: 'sub-c-f50821cc-43ab-11e7-b66e-0619f8945a4f',
        publishKey: 'pub-c-d96dbe02-77ff-47ee-b817-aaeecc7ad07c',
        ssl: true
    });

/////////// UI stuff

    // UI elements and state

    const appKeyElement = $('#appKey');

    const codeToSendElement = $('#codeToSend');
    const codeLocalElement = $('#codeLocal');
    const outputConsole = $('#outputConsole');

    codeToSendElement.prop('wrap', 'off');
    codeLocalElement.prop('wrap', 'off');
    outputConsole.prop('wrap', 'off');

    const buttonSend = $('#buttonSend');

    const readyProcessorsCountElement = $('#readyProcessorsCount');
        
    const buttonStartRemoteTask = $('#buttonStartRemoteTask');

    const buttonTerminateFunction = $('#buttonTerminateFunction');

    // UI controller

    function updateReadyProcessors()
    {
        readyProcessorsCountElement.text
        (
            'Ready processors: ' + readyProcessorsCount + ' (total workers: ' + totalWorkersCount + ')'
        );
    }
        
    updateReadyProcessors();

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

    function returnUIToInitalState()
    {
        readyProcessorsCount = 0;
        totalWorkersCount = 0;

        updateReadyProcessors();

        appKeyElement.prop('disabled', false);

        buttonSend.prop('disabled', false);

        buttonStartRemoteTask.prop('disabled', true);
        buttonTerminateFunction.prop('disabled', true);
    }

    function setUIReadyToStartRemoteTask()
    {
        appKeyElement.prop('disabled', true);

        buttonSend.prop('disabled', true);

        buttonStartRemoteTask.prop('disabled', false);
        buttonTerminateFunction.prop('disabled', false);        
    }

    function setUIReadyToTerminateRemoteTask()
    {
        buttonStartRemoteTask.prop('disabled', true);
    }

    buttonSend.click(() => 
    {
        appKey = appKeyElement.val();

        var codeToSend = codeToSendElement.val();

        if(appKey && (appKey.length > 0) && codeToSend && (codeToSend.length > 0))
        {   
            publishRemoteCode(codeToSend);
        }
    });

    buttonStartRemoteTask.click(() => 
    {
        const codeLocal = codeLocalElement.val();

        if(codeLocal && (codeLocal.length > 0))
        {
            startRemoteTask(codeLocal);
        }
    });

    buttonTerminateFunction.click(() => 
    {
        closeFunction();
    });

/////////// Main Controller stuff

    function publishCodeToBlock(code, callbackOnDone)
    {
        var request = {appKey: appKey, code: code};

        if(code)
        {
            request.randomToken = 'rt-' + Math.floor(Math.random() * 1000000);
        }
        
        comm.fire
        ({
            message: request,
            channel: injectorChannel,
            sendByPost: true
        },
        (status, response) => 
        {
            if(!status.error)
            {
                if(callbackOnDone)
                {
                    callbackOnDone(request.randomToken);
                }                
            }
        });
    }

    function publishRemoteCode(argRemoteCode)
    {
        publishCodeToBlock(argRemoteCode, (randomToken) => 
        {
            masterNode = new MasterNode(comm, appKey, onMasterNodeError, onMasterNodeOutput);

            enumerationChannel = 'enumeration-' + randomToken + '-' + appKey;

            comm.subscribe({channels: [enumerationChannel]});
            
            setUIReadyToStartRemoteTask();            
        });
    }

    function startRemoteTask(localCode)
    {
        if(masterNode)
        {
            if(masterNode.start(localCode))
            {
                setUIReadyToTerminateRemoteTask();
            }
        }        
    }

    function closeFunction()
    {
        comm.unsubscribe({channels: [enumerationChannel]});
        
        enumerationChannel = undefined;

        publishCodeToBlock(null);

        if(masterNode)
        {
            masterNode.terminate();

            masterNode = undefined;
        }

        returnUIToInitalState();
    }

    function onMasterNodeError(e)
    {
        console.log(e);

        closeFunction();        
    }

    function onMasterNodeOutput(message)
    {
        var currentConsoleContent = outputConsole.val();
        
        outputConsole.val(currentConsoleContent + message + '\n');

        outputConsole.scrollTop(outputConsole[0].scrollHeight);        
    }

    comm.addListener
    ({
        message: (m) => 
        {   
            if(masterNode)
            {
                if(m.channel === enumerationChannel)
                {                    
                    var remoteProcessorInfo = m.message; 

                    masterNode.addWorkerNode(remoteProcessorInfo);

                    addProcessor(remoteProcessorInfo);
                }
                else
                {
                    masterNode.processIncomingMessage(m);
                }                
            }            
        }
    });    
});

//--------------------------------------------------------------------------------------------
