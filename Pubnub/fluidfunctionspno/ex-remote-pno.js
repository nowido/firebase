var workersCount;
var idWorker;
var idInstance;

var appKey;

var resultsChannel;

const MASTER = 0;

var calcRepliesCount = 0;

var accPi = 0;
var accCount = 0;

function Main(instanceParameters)
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
}

function OnServiceMessage(wrapper)
{

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

function publishResult(result)
{
    var resultWrapper = 
    {        
        message: result,
        channel: resultsChannel,
        storeInHistory: false,
        sendByPost: true
    };

    return {outgoing: true, message: resultWrapper};
}

function castTask(pointsCount)
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

function MessagesProcessor(msgIn)
{    
    var payloadMessage = msgIn.message;

    if(msgIn.incoming)
    {
        if(payloadMessage.pointsCount && (idWorker === MASTER))
        {
            var pointsCount = payloadMessage.pointsCount;

            resultsChannel = payloadMessage.resultsChannel;

            if(workersCount > 1)
            {
                castTask(pointsCount);
            }

            accPi += calcMonteCarloPi(pointsCount);     
            accCount += pointsCount;
                
            if(workersCount === 1)
            {
                return publishResult({pointsCount: accCount, piEstimation: accPi});
            }
            else
            {
                ++calcRepliesCount;
            }            
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
                return publishResult({pointsCount: accCount, piEstimation: accPi / workersCount});
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
