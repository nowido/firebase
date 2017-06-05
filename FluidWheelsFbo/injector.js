//--------------------------------------------------------------------------------------------

importScripts
(
    'https://www.gstatic.com/firebasejs/4.0.0/firebase-app.js', 
    'https://www.gstatic.com/firebasejs/4.0.0/firebase-database.js'
);

//--------------------------------------------------------------------------------------------

var firebaseApp = firebase.initializeApp
({
    apiKey: 'AIzaSyAd420fTum26q2xJOjK-Do8eSaOpZ_hNLw',        
    databaseURL: "https://fluidbridge.firebaseio.com"
});

//--------------------------------------------------------------------------------------------

const STATUS_FUNCTION_PUBLISHED = 1;

var appKey;

var localWorker;

//--------------------------------------------------------------------------------------------

//--------------------------------------------------------------------------------------------