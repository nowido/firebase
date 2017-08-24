export default (request) => 
{ 
    const kvstore = require('kvstore');
    const comm = require('pubnub');  
    
    // handler is on 'f-counter' channel

    const key = 'counter';

    const action = request.message.action;
    const feedbackChannel = request.message.feedbackChannel;
    
    if(feedbackChannel && (feedbackChannel.length > 0))
    {
        var delta = 0;

        if(action === '+')
        {
            delta = 1;            
        }
        else if(action === '-')
        {
            delta = -1;             
        }

        kvstore.incrCounter(key, delta);
        
        kvstore.getCounter(key).then((value) => 
        {
            comm.publish
            ({
                message: value,
                channel: feedbackChannel
            });
        });    
    }
    
    //console.log('request',request); // Log the request envelope passed 
    return request.ok(); // Return a promise when you're done 
}