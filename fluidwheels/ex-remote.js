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
    // present fields:
    // msgIn.idWorker
    // msgIn.task

    // msgOut.idInstance
    // msgOut.idWorker

    if(msgIn.task)
    {   
        if(msgIn.task.pointsCount)
        {
            var pointsCount = msgIn.task.pointsCount;
            var piEstimation = calcMonteCarloPi(pointsCount);     

            msgOut.result = {pointsCount: pointsCount, piEstimation: piEstimation};                
        }
        else if(msgIn.task.enumeration)
        {
            msgOut.result = {enumeration: msgIn.task.enumeration};
        }
    }
}