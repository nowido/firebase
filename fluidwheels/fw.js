//--------------------------------------------------------------------------------------------

/*
function MessagesProcessor(msgIn, msgOut)
{    
    if(msgIn.task)
    {
        msgOut.idWorker = msgIn.idWorker;
        msgOut.result = msgIn.task  + '!!!';        
    }            
}
*/
//--------------------------------------------------------------------------------------------

function WorkerProc()
{
    onmessage = function(m)
    {
        var msgOut = {};

        MessagesProcessor(m.data, msgOut);

        postMessage(msgOut);
    }
}

//--------------------------------------------------------------------------------------------

$(() => 
{
    var comm = new PubNub
    ({
        publishKey: 'pub-c-d96dbe02-77ff-47ee-b817-aaeecc7ad07c',
        subscribeKey: 'sub-c-f50821cc-43ab-11e7-b66e-0619f8945a4f',        
        ssl: true
    });   
    
    var funcChannel = 'func-8fd51e6d-9cf5-480c-9578-fcf7f8cb18fa';
    var taskChannel = 'task-bb4f6831-fe85-478c-b8ff-857396f5f426';

    var buttonStartElement1 = $('#buttonStart1');
    var buttonStartElement2 = $('#buttonStart2');
    var buttonStartElement4 = $('#buttonStart4');
    var buttonStartElement8 = $('#buttonStart8');
        
    var workers;

    function onWorkerMessage(m)
    {
        console.log(m.data);
    }

    function onWorkerError(m)
    {
        console.log('* ' + e.message);
        w.terminate();        
    }

    function onCommMessage(m)
    {   
        var msgBody = m.message;

        if(msgBody.func)
        {
            comm.unsubscribe({channels: [funcChannel]});        

            buttonStartElement1.prop('disabled', false);
            buttonStartElement2.prop('disabled', false);
            buttonStartElement4.prop('disabled', false);
            buttonStartElement8.prop('disabled', false);

            var workerCodeURL = URL.createObjectURL(new Blob([msgBody.func, '(' + WorkerProc.toString() + ')()'], {type : 'text/javascript'})); 

            function createWorkers(count)
            {
                workers = [];

                for(var i = 0; i < count; ++i)
                {
                    try
                    {
                        var w = new Worker(workerCodeURL);

                        w.onmessage = onWorkerMessage;
                        w.onerror = onWorkerError;

                        workers.push(w);        
                    }
                    catch(e)
                    {}    
                }

                URL.revokeObjectURL(workerCodeURL);

                comm.subscribe({channels: [taskChannel], withPresence: false});                
            }

            buttonStartElement1.click(() => {createWorkers(1); buttonStartElement1.prop('disabled', true);});
            buttonStartElement2.click(() => {createWorkers(2); buttonStartElement2.prop('disabled', true);});
            buttonStartElement4.click(() => {createWorkers(4); buttonStartElement4.prop('disabled', true);});
            buttonStartElement8.click(() => {createWorkers(8); buttonStartElement8.prop('disabled', true);});
        }  
        else if(msgBody.task)
        {
            var count = workers.length;

            for(var i = 0; i < count; ++i)
            {
                workers[i].postMessage({idWorker: i, task: msgBody.task});
            }    
        }   
    }

    comm.addListener({message: onCommMessage});
    
    comm.subscribe({channels: [funcChannel], withPresence: false});
});

//--------------------------------------------------------------------------------------------