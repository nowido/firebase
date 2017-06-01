importScripts
(
    'https://www.gstatic.com/firebasejs/4.0.0/firebase-app.js', 
    'https://www.gstatic.com/firebasejs/4.0.0/firebase-database.js'
);

var appKey;

var resultsQueueKey;

const pointsCount = 100000000; // 100 millions

var tasksCount = 0;
var calcRepliesCount = 0;

var accPi = 0;
var accCount = 0;

function onIncomingResult(result)
{
    var count = result.pointsCount;
    var pi = result.piEstimation;

    if(count && pi)
    {
        accPi += pi;
        accCount += count;
        
        ++calcRepliesCount;

        if(calcRepliesCount === tasksCount)
        {
            firebase.database().ref(resultsQueueKey).off('child_added');
            firebase.database().ref(resultsQueueKey).remove();
            
            firebase.database().ref('MCPI').set({pointsCount: accCount, piEstimation: accPi / calcRepliesCount});
        }
    }
}

function onChildAdded(snapshot)
{
    var result = snapshot.val();

    if(result)
    {
        onIncomingResult(result);
    }
}

function Main(argAppKey)
{
    appKey = argAppKey;

    resultsQueueKey = appKey + '/results';

    firebase.initializeApp
    ({
        apiKey: 'AIzaSyAd420fTum26q2xJOjK-Do8eSaOpZ_hNLw',        
        databaseURL: "https://fluidbridge.firebaseio.com"
    });
    
    firebase.database().ref(resultsQueueKey).on('child_added', onChildAdded);

    postMessage({enumeration: true});    
}

function OnRemoteResultReceived(msg)
{
    if(msg.enumeration)
    {        
        ++tasksCount;

        firebase.database().ref(msg.key).set({pointsCount: pointsCount});
    }
}