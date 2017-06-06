//--------------------------------------------------------------------------------------------

const maxWorkers = 8;

var workersCount = 1;

var appKey;

var functionsEntryRef;

var acceptedFunctionEntryRef;

var acceptedFunctionKey;

var workers;

//--------------------------------------------------------------------------------------------

function WorkerProc()
{
    onmessage = function(m)
    {
        var wrapper = m.data;

        if(wrapper.localCast)
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
            if(wrapper.init)
            {
                if(InitInstance)
                {
                    InitInstance(wrapper.message);
                }
            }
            else if(wrapper.close)
            {
                if(CloseInstance)
                {
                    CloseInstance();
                }
            }
        }                
    }
}

//--------------------------------------------------------------------------------------------

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

                if((index >= 0) && (index < workersCount))
                {
                    workers[index].postMessage({localCast: true, message: wrapper.message});
                }                    
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

    window.addEventListener('beforeunload', (e) => 
    {        
        sendCloseSignal();
    });

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
            trackFunctionPresent();

            appKeyElement.prop('disabled', true);
            buttonReceiveFunction.prop('disabled', true);              

            labelStatus.text(statusWaitingFunctionLabel);          
        }
    });

    function returnToInitialState()
    {
        if(functionsEntryRef)
        {
            functionsEntryRef.off('child_added');    
            functionsEntryRef = undefined;
        }

        if(acceptedFunctionEntryRef)
        {
            acceptedFunctionEntryRef.off('value');
            acceptedFunctionEntryRef = undefined;
        }
        
        terminateWorkers();

        disableWorkersCountInput(false);

        appKeyElement.prop('disabled', false);
        buttonReceiveFunction.prop('disabled', false);

        labelStatus.text(statusInactiveLabel);

        functionReceived.val('');        
    }

/////////// Firebase stuff

    function trackFunctionPresent()
    {
        functionsEntryRef = firebase.database().ref(appKey + '/functions').limitToLast(1);
        
        functionsEntryRef.on('child_added', (snapshot) => 
        {                
            acceptedFunctionKey = snapshot.key;

            var code = snapshot.val();

            if((workers === undefined) && code && (code.length > 0))
            {                    
                if(startWorkers(code))
                {                    
                    labelStatus.text(statusActiveLabel);

                    functionReceived.val(code);  

                    trackFunctionClose();
                }                                
            }
        });            
    }

    function trackFunctionClose()
    {
        acceptedFunctionEntryRef = firebase.database().ref(appKey + '/functions/' + acceptedFunctionKey);

        acceptedFunctionEntryRef.on('value', (snapshot) => 
        {
            if(!snapshot.val())
            {
                terminateWorkers();

                acceptedFunctionEntryRef.off('value');     
                acceptedFunctionEntryRef = undefined;           
                
                labelStatus.text(statusWaitingFunctionLabel);

                functionReceived.val('');                                        
            }
        });
    }

/////////// workers stuff

    function onWorkerError(e)
    {
        console.log(e.message);                

        returnToInitialState();
    }
//
    function startWorkers(code)
    {
        var status = true;

        var workerCodeURL = URL.createObjectURL(new Blob([code, '(' + WorkerProc.toString() + ')()'], {type : 'text/javascript'})); 

        var instanceParameters = 
        {
            workersCount: workersCount,            
            idInstance: acceptedFunctionKey, 
            appKey: appKey
        }; 

        workers = [];

        for(var i = 0; i < workersCount; ++i)
        {
            try
            {
                var w = new Worker(workerCodeURL);

                w.onmessage = onWorkerMessage;
                w.onerror = onWorkerError;

                instanceParameters.idWorker = i;

                w.postMessage({service: true, init: true, message: instanceParameters});

                workers.push(w);        
            }
            catch(e)
            {
                status = false;
                break;
            }    
        }

        URL.revokeObjectURL(workerCodeURL);

        if(!status)
        {
            terminateWorkers();
        }

        return status;
    }
//
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
//
    function sendCloseSignal()
    {
        if(workers)
        {
            var count = workers.length;

            for(var i = 0; i < count; ++i)
            {
                workers[i].postMessage({service: true, close: true});
            }
        }            
    }
});

//--------------------------------------------------------------------------------------------
