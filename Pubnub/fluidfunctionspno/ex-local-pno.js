const pointsCount = 100000000; // 100 millions

var appKey;

var idInstance;

var remoteProcessors;

var tasksCount = 0;
var calcRepliesCount = 0;

var accPi = 0;
var accCount = 0;

var timeStart = Date.now();

function Main(instanceParameters)
{
    appKey = instanceParameters.appKey;
    idInstance = instanceParameters.idInstance;
    remoteProcessors = instanceParameters.remoteProcessors;

    postMessage({service: true, reason: 'subscribe', message: {channels: [idInstance]}});

    var keys = Object.keys(remoteProcessors);

    var count = keys.length;

    for(var i = 0; i < count; ++i)
    {
        var proc = remoteProcessors[keys[i]];

        var publishParameters = 
        {
            message: {pointsCount: pointsCount, resultsChannel: idInstance},
            channel: proc.feedbackChannel,
            storeInHistory: false,
            sendByPost: true
        };

        postMessage({outgoing: true, message: publishParameters});

        ++tasksCount;
    }
}

function OnServiceMessage(wrapper)
{
    if(wrapper.reason === 'add')
    {
        remoteProcessors[wrapper.message.UUID] = wrapper.message;

        // give a task
    }
    else if(reason === 'remove')
    {
        delete remoteProcessors[wrapper.message.UUID];

        // retry task?
    }
}

function OnIncomingMessage(wrapper)
{
    var result = wrapper.message;

    var count = result.pointsCount;
    var pi = result.piEstimation;
    
    if(count && pi)
    {
        accPi += pi;
        accCount += count;
        
        ++calcRepliesCount;

        if(calcRepliesCount === tasksCount)
        {
            var runTime = Math.round((Date.now() - timeStart) / 10) / 100; 

            showStats(accPi / calcRepliesCount, accCount, runTime);            
        }
    }
}

function showStats(piEstimation, accPointsCount, runTime)
{
    var gigaPoints = Math.round(accPointsCount / runTime / 1e6) / 1e3;

    postMessage
    ({
        service: true, 
        reason: 'output', 
        message: 'Monte-Carlo Pi estimation: ' + piEstimation + ' (' + accPointsCount + ' points), ' +
                    runTime + ' s (' + gigaPoints + ' Gpts/s)'
    });    
}
