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

var tasksChannelRef;
var resultsChannelRef;

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

    function onTaskAdded(snapshot)
    {
        var task = snapshot.val();

        if(task)
        {
            var pointsCount = task.pointsCount;

            if(pointsCount)
            {       
                snapshot.ref.remove();
                
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
    }

    var enumerationInfo = 
    {
        workersCount: workersCount
    };

    instanceUniqueRef = firebase.database().ref(appKey + '/instances/' + idInstance).push(enumerationInfo, (error) => 
    {
        if(!error)
        {
            instanceUniqueRef.onDisconnect().remove();

            var instanceUniqueKey = instanceUniqueRef.key;

            tasksChannelRef = firebase.database().ref(appKey + '/tasks/' + idInstance + '/' + instanceUniqueKey);
            resultsChannelRef = firebase.database().ref(appKey + '/results/' + idInstance + '/' + instanceUniqueKey);

            tasksChannelRef.on('child_added', onTaskAdded);
            tasksChannelRef.onDisconnect().remove();

            resultsChannelRef.onDisconnect().remove();
        }
    });

// end of MASTER only stuff

} // end of InitInstance

function CloseInstance()
{
    // this is not guaranteed to be called
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

function calcMonteCarloPi2(pointsCount)
{
    const innerCount = 200;

    var e = 0;

    for(var n = 0; n < pointsCount; ++n)
    {
        var wn = 0;

        for(var k = 0; k < innerCount; ++k)
        {
            wn += ((Math.random() < 0.5) ? -1 : 1);
        }

        e += Math.abs(wn);
    }

    e /= pointsCount;

    return 2 * pointsCount / (e * e);
}                

/*
function calcLeibnizPi(pointsCount)
{
    var sumPlus = 0;
    var sumMinus = 0;

    var factorPlus = 1;
    var factorMinus = 3;

    const addent = 4;

    const count = Math.floor(pointsCount / 2);

    for (var i = 0; i < count; ++i)
    {
        sumPlus += 1 / factorPlus;
        factorPlus += addent;

        sumMinus += 1 / factorMinus;
        factorMinus += addent;
    }

    return 4 * (sumPlus - sumMinus);        
}                
*/

function publishResult(result)
{
    resultsChannelRef.push(result);
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
