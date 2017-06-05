//--------------------------------------------------------------------------------------------

importScripts
(
    'https://www.gstatic.com/firebasejs/4.0.0/firebase-app.js', 
    'https://www.gstatic.com/firebasejs/4.0.0/firebase-database.js'
);

//--------------------------------------------------------------------------------------------

var firebaseApp = firebase.initializeApp
({
    apiKey: 'AIzaSyAd420fTum26q2xJOjK-Do8eSaOpZ_hNLw',        
    databaseURL: "https://fluidbridge.firebaseio.com"
});

//--------------------------------------------------------------------------------------------

const STATUS_WAITING_FUNCTION = 1;
const STATUS_ACTIVE = 2;

var workersCount;

var appKey;

var workers;

var acceptedCodeKey;

var codeEntryRef;

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
            if(InitInstance)
            {
                InitInstance(wrapper.message);
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

function onWorkerError(e)
{
    console.log(e.message);                

    returnToInitialState();
}

//--------------------------------------------------------------------------------------------

function startWorkers(code)
{
    var status = true;

    var workerCodeURL = URL.createObjectURL(new Blob([code, '(' + WorkerProc.toString() + ')()'], {type : 'text/javascript'})); 

    var instanceParameters = 
    {
        workersCount: workersCount,            
        idInstance: acceptedCodeKey, 
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

    if(!status)
    {
        terminateWorkers();
    }

    return status;
}

//--------------------------------------------------------------------------------------------

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

//--------------------------------------------------------------------------------------------

function returnToInitialState()
{
    terminateWorkers();

    if(codeEntryRef)
    {
        codeEntryRef.off('value');    
        codeEntryRef = undefined;
    }

    postMessage({service: true, status: STATUS_WAITING_FUNCTION});    
}

//--------------------------------------------------------------------------------------------

function trackFunctionClose()
{
    codeEntryRef = firebase.database().ref(appKey + '/functions/' + acceptedCodeKey);

    codeEntryRef.on('value', (snapshot) => 
    {
        if(!snapshot.val())
        {
            returnToInitialState();            
        }
    });
}

//--------------------------------------------------------------------------------------------

function trackFunctionPresent()
{
    firebase.database().ref(appKey + '/functions').limitToLast(1).on('child_added', (snapshot) => 
    {                
        var code = snapshot.val();
        var codeKey = snapshot.key;

        if((workers === undefined) && code && (code.length > 0))
        {                    
            acceptedCodeKey = codeKey;

            if(startWorkers(code))
            {
                postMessage({service: true, status: STATUS_ACTIVE});

                trackFunctionClose();
            }                                
        }
    });            
}

//--------------------------------------------------------------------------------------------

onmessage = function(m)
{
    var wrapper = m.data;

    if(wrapper.service)
    {
        appKey = wrapper.appKey;

        workersCount = wrapper.workersCount;

        if(firebaseApp)
        {
            postMessage({service: true, status: STATUS_WAITING_FUNCTION});
        }
        
        trackFunctionPresent();
    }
}

//--------------------------------------------------------------------------------------------