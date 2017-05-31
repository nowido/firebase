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

function main()
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

function onRemoteResultReceived(msg)
{
    if(msg.result)
    {
        if(msg.result.enumeration)
        {
            if(enumerationPhase)
            {
                ++enumerationRepliesCount;
            }            
        }
        else
        {
            var count = msg.result.pointsCount;
            var pi = msg.result.piEstimation;

            accPi += pi;
            accCount += count;

            if(count && pi)
            {
                ++calcRepliesCount;

                if(calcRepliesCount === enumerationRepliesCount)
                {
                    firebase.database().ref('MCPI').set({pointsCount: accCount, piEstimation: accPi / calcRepliesCount});
                }

                //firebase.database().ref('MCPI-raw').push({pointsCount: count, piEstimation: pi});
            }
        }
    }

    //console.log(msg);
}