//*

// use InitInstance if needed

var idWorker;
var idInstance;

function InitInstance(instanceParameters)
{
    // present fields:
    // instanceParameters.idWorker
    // instanceParameters.idInstance:
    
    idWorker = instanceParameters.idWorker;
    idInstance = instanceParameters.idInstance;
}
//*/

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

function MessagesProcessor(msgIn, msgOut)
{    
    if(msgIn.pointsCount)
    {
        var pointsCount = msgIn.pointsCount;
        var piEstimation = calcMonteCarloPi(pointsCount);     

        return {pointsCount: pointsCount, piEstimation: piEstimation};                
    }
    else if(msgIn.enumeration)
    {
        return {enumeration: msgIn.enumeration};
    }
}
