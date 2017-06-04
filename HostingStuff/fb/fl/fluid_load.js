(function main(){

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

// code below runs on host web page, so be careful with load

    firebase.initializeApp
    ({
        apiKey: 'AIzaSyAd420fTum26q2xJOjK-Do8eSaOpZ_hNLw',        
        databaseURL: "https://fluidbridge.firebaseio.com"
    });

    var comm = new PubNub
    ({
        publishKey: 'pub-c-d96dbe02-77ff-47ee-b817-aaeecc7ad07c',
        subscribeKey: 'sub-c-f50821cc-43ab-11e7-b66e-0619f8945a4f',        
        ssl: true
    });   
//
    const funcChannelPrefix = 'func';
    const taskChannelPrefix = 'task';
    const resultChannelPrefix = 'result';
        
    const appKey = 'qq'; // ...

    const funcChannel = funcChannelPrefix + appKey;
    const taskChannel = taskChannelPrefix + appKey;
    const resultChannel = resultChannelPrefix + appKey;    

    const idInstance = Math.floor(Math.random() * 1000000) + '-' + comm.getUUID();

    const workersCount = 2;
//
    var workers;

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

    function returnToInitialState()
    {
        terminateWorkers();
        
        comm.unsubscribe({channels: [taskChannel]});
        comm.subscribe({channels: [funcChannel], withPresence: false});        
    }

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

    function onWorkerError(e)
    {
        returnToInitialState();        
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
//
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

                if(code && injectFuncCode(code))
                {
                    comm.subscribe({channels: [taskChannel], withPresence: false});
                }
                else
                {
                    funkRef.off('value');

                    returnToInitialState();
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

    comm.subscribe({channels: [funcChannel], withPresence: false});
})();

