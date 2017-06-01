importScripts
(
    'https://www.gstatic.com/firebasejs/4.0.0/firebase-app.js', 
    'https://www.gstatic.com/firebasejs/4.0.0/firebase-database.js'
);

const pointsCount = 100000000; // 100 millions

var tasksCount = 0;
var calcRepliesCount = 0;

var accPi = 0;
var accCount = 0;

function Main()
{
    firebase.initializeApp
    ({
        apiKey: 'AIzaSyAd420fTum26q2xJOjK-Do8eSaOpZ_hNLw',        
        databaseURL: "https://fluidbridge.firebaseio.com"
    });

    postMessage({enumeration: true});    
}

function OnRemoteResultReceived(msg)
{
    if(msg.enumeration)
    {        
        ++tasksCount;

        firebase.database().ref(msg.key).set({pointsCount: pointsCount});
    }
    else if(msg.piEstimation)
    {
        var count = msg.pointsCount;
        var pi = msg.piEstimation;

        if(count && pi)
        {
            accPi += pi;
            accCount += count;
            
            ++calcRepliesCount;

            if(calcRepliesCount === tasksCount)
            {
                firebase.database().ref('MCPI').set({pointsCount: accCount, piEstimation: accPi / calcRepliesCount});
            }
        }
    }
}