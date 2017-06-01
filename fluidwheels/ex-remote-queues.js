importScripts
(
    'https://www.gstatic.com/firebasejs/4.0.0/firebase-app.js', 
    'https://www.gstatic.com/firebasejs/4.0.0/firebase-database.js'
);

var idWorker;
var idInstance;

var instanceKey;

var appKey;

var taskKey;
var resultsQueueKey;

function InitInstance(instanceParameters)
{
    // present fields:
    // instanceParameters.idWorker
    // instanceParameters.idInstance:
    
    idWorker = instanceParameters.idWorker;
    idInstance = instanceParameters.idInstance;

    appKey = instanceParameters.appKey;

    instanceKey = idWorker + '-' + idInstance;

    taskKey = appKey + '/task/' + instanceKey;
    resultsQueueKey = appKey + '/results';

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
    if(task.pointsCount)
    {
        var pointsCount = task.pointsCount;
        var piEstimation = calcMonteCarloPi(pointsCount);     

        firebase.database().ref(taskKey).off('value');
        firebase.database().ref(taskKey).remove();
        
        firebase.database().ref(resultsQueueKey).push({pointsCount: pointsCount, piEstimation: piEstimation});        
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

function MessagesProcessor(msgIn, msgOut)
{    
    if(msgIn.enumeration)
    {
        firebase.database().ref(taskKey).on('value', onKeyValueChange);

        return {enumeration: msgIn.enumeration, key: taskKey};
    }
}