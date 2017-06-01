importScripts
(
    'https://www.gstatic.com/firebasejs/4.0.0/firebase-app.js', 
    'https://www.gstatic.com/firebasejs/4.0.0/firebase-database.js'
);

const pointsCount = 100000000; // 100 millions

var enumerationPhase = true;

var enumerationRepliesCount = 0;

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
    
    setTimeout(() => 
    {
        enumerationPhase = false;
        postMessage({pointsCount: pointsCount});
    }, 3000);    

    postMessage({enumeration: true});    
}

function OnRemoteResultReceived(msg)
{
    if(msg.enumeration)
    {
        if(enumerationPhase)
        {
            ++enumerationRepliesCount;
        }            
    }
    else
    {
        var count = msg.pointsCount;
        var pi = msg.piEstimation;

        if(count && pi)
        {
            accPi += pi;
            accCount += count;
            
            ++calcRepliesCount;

            if(calcRepliesCount === enumerationRepliesCount)
            {
                firebase.database().ref('MCPI').set({pointsCount: accCount, piEstimation: accPi / calcRepliesCount});
            }

            //firebase.database().ref('MCPI-raw').push({pointsCount: count, piEstimation: pi});
        }
    }

    //console.log(msg);
}
