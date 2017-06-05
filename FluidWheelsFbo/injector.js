//--------------------------------------------------------------------------------------------

importScripts
(
    'https://www.gstatic.com/firebasejs/4.0.0/firebase-app.js', 
    'https://www.gstatic.com/firebasejs/4.0.0/firebase-database.js'
);

//--------------------------------------------------------------------------------------------

const STATUS_WAITING_FUNCTION = 1;
const STATUS_FUNCTION_PUBLISHED = 2;
const STATUS_ACTIVE = 3;

//--------------------------------------------------------------------------------------------

var firebaseApp = firebase.initializeApp
({
    apiKey: 'AIzaSyAd420fTum26q2xJOjK-Do8eSaOpZ_hNLw',        
    databaseURL: "https://fluidbridge.firebaseio.com"
});

//--------------------------------------------------------------------------------------------

var appKey;

var localWorker;

var codeEntryRef;

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

function publishFunction(codeToSend)
{
    codeEntryRef = firebase.database().ref(appKey + '/functions').push(codeToSend, (error) => 
    {
        if(!error)
        {   
            postMessage({service: true, status: STATUS_FUNCTION_PUBLISHED});
        }
    });
}

//--------------------------------------------------------------------------------------------

function closeFunctionEntry()
{
    if(codeEntryRef)
    {
        firebase.database().ref(appKey + '/instances/' + codeEntryRef.key).remove();
        firebase.database().ref(appKey + '/tasks/' + codeEntryRef.key).remove();
        firebase.database().ref(appKey + '/results/' + codeEntryRef.key).remove();
        
        codeEntryRef.remove();

        codeEntryRef = undefined;                
    }

    postMessage({service: true, status: STATUS_WAITING_FUNCTION});
}

//--------------------------------------------------------------------------------------------

function onMessageFromLocalWorker(m)
{
}

function onLocalWorkerError(e)
{
    console.log(e.message);                

    terminateLocalWorker();

    postMessage({service: true, status: STATUS_FUNCTION_PUBLISHED});    
}

//--------------------------------------------------------------------------------------------

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

//--------------------------------------------------------------------------------------------

function terminateLocalWorker()
{
    if(localWorker)
    {
        localWorker.terminate();
        localWorker = undefined;
    }
}

//--------------------------------------------------------------------------------------------

onmessage = function(m)
{
    var wrapper = m.data;

    if(wrapper.service)
    {        
        if(wrapper.appKey)
        {
            appKey = wrapper.appKey;

            if(firebaseApp)
            {
                postMessage({service: true, status: STATUS_WAITING_FUNCTION});
            }
        }
        else if(wrapper.codeToSend)
        {
            publishFunction(wrapper.codeToSend);
        }
        else if(wrapper.codeLocal)
        {
            terminateLocalWorker();

            if(startLocalWorker(wrapper.codeLocal))
            {
                postMessage({service: true, status: STATUS_ACTIVE});
            }
        }
        else if(wrapper.closeFunction)
        {
            closeFunctionEntry();
        }
    }
}

//--------------------------------------------------------------------------------------------