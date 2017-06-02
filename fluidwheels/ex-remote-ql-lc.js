importScripts
(
    'https://www.gstatic.com/firebasejs/4.0.0/firebase-app.js', 
    'https://www.gstatic.com/firebasejs/4.0.0/firebase-database.js'
);

var workersCount;
var idWorker;
var idInstance;

var instanceKey;

var appKey;

var taskKey;

const MASTER = 0;

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

    instanceKey = idWorker + '-' + idInstance;

    taskKey = appKey + '/task/' + instanceKey;

    firebase.initializeApp
    ({
        apiKey: 'AIzaSyAd420fTum26q2xJOjK-Do8eSaOpZ_hNLw',        
        databaseURL: "https://fluidbridge.firebaseio.com"
    });    
}

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

function onIncomingTask(task)
{
    var pointsCount = task.pointsCount;

    if(pointsCount)
    {       
        firebase.database().ref(taskKey).off('value');
        firebase.database().ref(taskKey).remove();
        
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
            var outgoingResultWrapper = 
            {
                outgoing: true, 
                message: {pointsCount: accCount, piEstimation: accPi}
            };
            
            postMessage(outgoingResultWrapper);
        }
        else
        {
            ++calcRepliesCount;
        }
    }
}

function onKeyValueChange(snapshot)
{
    var task = snapshot.val();

    if(task)
    {
        onIncomingTask(task);
    }
}

function MessagesProcessor(msgIn)
{    
    var payloadMessage = msgIn.message;

    if(msgIn.incoming)
    {        
        if(payloadMessage.enumeration && (idWorker === MASTER))
        {
            firebase.database().ref(taskKey).on('value', onKeyValueChange);

            var outgoingAskTaskWrapper = 
            {
                outgoing: true, 
                message: {enumeration: payloadMessage.enumeration, key: taskKey}
            };

            return outgoingAskTaskWrapper;
        }
    }
    else if(msgIn.localCast)
    {
        if(payloadMessage.gather && (idWorker === MASTER))
        {
            accPi += payloadMessage.piEstimation;     
            accCount += payloadMessage.pointsCount;

            ++calcRepliesCount;
            
            if(calcRepliesCount === workersCount)
            {
                var outgoingResultWrapper = 
                {
                    outgoing: true, 
                    message: {pointsCount: accCount, piEstimation: accPi / workersCount}
                };
                
                return outgoingResultWrapper; 
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
