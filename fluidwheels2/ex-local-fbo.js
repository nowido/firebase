importScripts
(
    'https://www.gstatic.com/firebasejs/4.0.0/firebase-app.js', 
    'https://www.gstatic.com/firebasejs/4.0.0/firebase-database.js'
);

const pointsCount = 100000000; // 100 millions

var appKey;

var idInstance;

var tasksCount = 0;
var calcRepliesCount = 0;

var accPi = 0;
var accCount = 0;

function Main(argAppKey, argIdInstance)
{
    appKey = argAppKey;
    idInstance = argIdInstance;

    firebase.initializeApp
    ({
        apiKey: 'AIzaSyAd420fTum26q2xJOjK-Do8eSaOpZ_hNLw',        
        databaseURL: "https://fluidbridge.firebaseio.com"
    });
    
    firebase.database().ref(appKey + '/instances/' + idInstance).on('child_added', (snapshot) => 
    {        
        var entry = snapshot.val();

        if(entry)
        {
            ++tasksCount;
            
            firebase.database().ref(appKey + '/tasks/' + idInstance + '/' + snapshot.key).set({pointsCount: pointsCount});    
        }        
    });    

    firebase.database().ref(appKey + '/results/' + idInstance).on('child_added', onRemoteResultReceived);
}

function onRemoteResultReceived(snapshot)
{
    var entry = snapshot.val();

    if(entry)
    {
        if(entry.piEstimation)
        {
            var count = entry.pointsCount;
            var pi = entry.piEstimation;

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
}