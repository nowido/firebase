//--------------------------------------------------------------------------------------------

function WorkerProc()
{
    onmessage = function(m)
    {
        var wrapper = m.data;

        if(wrapper.incoming || wrapper.localCast)
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
            if(InitInstance)
            {
                InitInstance(wrapper.message);
            }
        }                
    }
}

//--------------------------------------------------------------------------------------------

const maxWorkers = 8;

var workersCount = 1;

var workers;

const funcChannelPrefix = 'func';
const taskChannelPrefix = 'task';
const resultChannelPrefix = 'result';

var appKey;

var funcChannel;
var taskChannel;
var resultChannel;

var idInstance;

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
        
    idInstance = Math.floor(Math.random() * 1000000) + '-' + comm.getUUID();

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

        funcChannel = funcChannelPrefix + appKey;
        taskChannel = taskChannelPrefix + appKey;
        resultChannel = resultChannelPrefix + appKey;

        comm.subscribe({channels: [funcChannel], withPresence: false});

        labelStatus.text(statusWaitingFunctionLabel);

        appKeyElement.prop('disabled', true);
        buttonReceiveFunction.prop('disabled', true);
    });

    function returnToInitialState()
    {
        comm.unsubscribe({channels: [taskChannel]});

        disableWorkersCountInput(false);

        appKeyElement.prop('disabled', false);
        buttonReceiveFunction.prop('disabled', false);

        labelStatus.text(statusInactiveLabel);

        functionReceived.val('');        
    }

/////////// workers stuff

    function onWorkerMessage(m)
    {   
        var wrapper = m.data;

        if(wrapper.outgoing)
        {
            comm.publish
            ({
                message: wrapper.message, 
                channel: resultChannel, 
                storeInHistory: false,
                sendByPost: true
            });                        
        }     
        else if(wrapper.localCast)
        {
            var castTo = wrapper.localTo;

            if(castTo && Array.isArray(castTo))
            {
                var count = castTo.length;

                for(var i = 0; i < count; ++i)
                {
                    var index = Math.floor(castTo[i]);

                    if((index >= 0) && (index < workersCount))
                    {
                        workers[index].postMessage({localCast: true, message: wrapper.message});
                    }                    
                }
            }             
        }
    }

    function terminateWorkers()
    {
        if(workers)
        {
            var count = workers.length;

            for(var i = 0; i < count; ++i)
            {
                workers[i].terminate();
            }    

            workers = undefined;
        }
    }

    function onWorkerError(e)
    {
        console.log(e.message);                

        if(workers)
        {
            terminateWorkers();
            
            returnToInitialState();
        }
    }

    function injectFuncCode(code)
    {
        var workerCodeURL = URL.createObjectURL(new Blob([code, '(' + WorkerProc.toString() + ')()'], {type : 'text/javascript'})); 

        workers = [];

        var status = true;

        var instanceParameters = 
        {
            workersCount: workersCount,            
            idInstance: idInstance, 
            appKey: appKey
        }; 

        for(var i = 0; i < workersCount; ++i)
        {
            try
            {
                var w = new Worker(workerCodeURL);

                w.onmessage = onWorkerMessage;
                w.onerror = onWorkerError;

                instanceParameters.idWorker = i;

                w.postMessage({service: true, message: instanceParameters});

                workers.push(w);        
            }
            catch(e)
            {
                status = false;
                break;
            }    
        }

        URL.revokeObjectURL(workerCodeURL);  

        return status;                                  
    }

    function onCommMessage(m)
    {   
        var msgBody = m.message;

        if(msgBody.func)
        {
            comm.unsubscribe({channels: [funcChannel]});        

            var funkRef = firebase.database().ref(appKey + '/functions/' + msgBody.func);
            
            funkRef.on('value', (snapshot) => 
            {
                var code = snapshot.val();

                if(code)
                {                                        
                    disableWorkersCountInput(true);

                    if(injectFuncCode(code))
                    {
                        comm.subscribe({channels: [taskChannel], withPresence: false});

                        labelStatus.text(statusActiveLabel);

                        functionReceived.val(code);                        
                    }
                }
                else
                {                       
                    funkRef.off('value');

                    terminateWorkers();
                    
                    // [un]comment either behaviour (continue listen | return to initial state)

                        // 1
                    comm.subscribe({channels: [funcChannel], withPresence: false});

                    labelStatus.text(statusWaitingFunctionLabel);

                    functionReceived.val('');                    

                        // 2                
                    // returnToInitialState();
                }
            });
        }  
        else
        {
            var count = workers.length;

            for(var i = 0; i < count; ++i)
            {                
                workers[i].postMessage({incoming: true, message: msgBody});
            }    
        }   
    }

    comm.addListener({message: onCommMessage});    
});

//--------------------------------------------------------------------------------------------
