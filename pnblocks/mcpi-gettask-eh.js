export default (request) => 
{ 
    // this handler is on 'get_task' channel

    const kvstore = require('kvstore');
    const comm = require('pubnub');  
    const utils = require('utils');
    
    const N = 100000000; // 100 millions

    const TTL = 1; // 1 minute

    comm.time().then((task_id) => 
    {
        const feedbackChannel = request.message.feedbackChannel;
        
        if(feedbackChannel && (feedbackChannel.length > 0))
        {   
            const msg = {task_id: task_id, count: N + utils.randomInt(0, N/5)};     

            comm.publish
            ({
                message: msg,
                channel: feedbackChannel
            });

            kvstore.set(task_id, msg, TTL);
        }    
    });
            
    return request.ok(); 
}