importScripts
(
    'https://www.gstatic.com/firebasejs/4.0.0/firebase-app.js', 
    'https://www.gstatic.com/firebasejs/4.0.0/firebase-database.js'
);

var workersCount;
var idWorker;
var idInstance;

var appKey;

const MASTER = 0;

var instanceUniqueRef;
var taskChannelRef;

var calcRepliesCount = 0;

var accPi = 0;
var accCount = 0;

function InitInstance(instanceParameters)
{
    // present fields:
    // instanceParameters.workersCount
    // instanceParameters.idWorker
    // instanceParameters.idInstance
    // instanceParameters.appKey
    
    workersCount = instanceParameters.workersCount;
    
    idWorker = instanceParameters.idWorker;

    idInstance = instanceParameters.idInstance;

    appKey = instanceParameters.appKey;

    if(idWorker !== MASTER)
    {
        return;
    }

// MASTER only stuff

    firebase.initializeApp
    ({
        apiKey: 'AIzaSyAd420fTum26q2xJOjK-Do8eSaOpZ_hNLw',        
        databaseURL: "https://fluidbridge.firebaseio.com"
    });    

    function onTaskValueChange(snapshot)
    {
        var task = snapshot.val();

        if(task)
        {
            onIncomingTask(task);
        }
    }

    function onIncomingTask(task)
    {
        var pointsCount = task.pointsCount;

        if(pointsCount)
        {       
            taskChannelRef.off('value');
            taskChannelRef.remove();
            taskChannelRef = undefined;
            
            if(workersCount > 1)
            {
                var castTo = [];

                for(var i = MASTER + 1; i < workersCount; ++i)
                {
                    castTo.push(i);
                }

                var localCastWrapper = 
                {
                    localCast: true, 
                    localTo: castTo,
                    message: {scatter: true, pointsCount: pointsCount}
                };

                postMessage(localCastWrapper);
            }

            accPi += calcMonteCarloPi(pointsCount);     
            accCount += pointsCount;
            
            if(workersCount === 1)
            {
                publishResult({pointsCount: accCount, piEstimation: accPi});
            }
            else
            {
                ++calcRepliesCount;
            }
        }
    }

    var enumerationInfo = 
    {
        workersCount: workersCount
    };

    instanceUniqueRef = firebase.database().ref(appKey + '/instances/' + idInstance).push(enumerationInfo, (error) => 
    {
        if(!error)
        {
            taskChannelRef = firebase.database().ref(appKey + '/tasks/' + idInstance + '/' + instanceUniqueRef.key);
            
            taskChannelRef.on('value', onTaskValueChange);
        }
    });

// end of MASTER only stuff

} // end of InitInstance

function calcMonteCarloPi(pointsCount)
{
    var inCircleCount = 0;

    for (var i = 0; i < pointsCount; ++i)
    {
        var x = Math.random();
        var y = Math.random();

        if(x * x + y * y < 1)
        {
            ++inCircleCount;
        }
    }

    return 4 * inCircleCount / pointsCount;        
}                

function publishResult(result)
{
    firebase.database().ref(appKey + '/results/' + idInstance + '/' + instanceUniqueRef.key).set(result);

    instanceUniqueRef.remove();        
}

function MessagesProcessor(msgIn)
{    
    var payloadMessage = msgIn.message;

    if(msgIn.localCast)
    {
        if(payloadMessage.gather && (idWorker === MASTER))
        {
            accPi += payloadMessage.piEstimation;     
            accCount += payloadMessage.pointsCount;

            ++calcRepliesCount;
            
            if(calcRepliesCount === workersCount)
            {
                publishResult({pointsCount: accCount, piEstimation: accPi / workersCount});
            }
        }
        else if(payloadMessage.scatter && (idWorker !== MASTER))
        {
            var pi = calcMonteCarloPi(payloadMessage.pointsCount);

            var localCastWrapper = 
            {
                localCast: true, 
                localTo: [MASTER],
                message: 
                {
                    gather: true,
                    piEstimation: pi,
                    pointsCount: payloadMessage.pointsCount
                }
            };

            return localCastWrapper;
        }
    }
}
