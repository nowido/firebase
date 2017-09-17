export default (request) => 
{ 
    // this handler is on 'worker_ready' channel
    
    const comm = require('pubnub'); 
    const xhr = require("xhr"); 
    
    const handlers = 
    [
        {entryPoint: 'test1', codeKey: 'test1'},
        {entryPoint: 'test2', codeKey: 'test2'}
    ];

    const feedbackChannel = request.message.feedbackChannel;

    if(feedbackChannel && (feedbackChannel.length > 0))
    {
        let randomIndex = Math.floor(Math.random() * handlers.length);
        
        let handler = handlers[randomIndex];
    
        let resultKey = 'opt3results' + randomIndex;

        xhr.fetch('https://fluidfunctions.firebaseio.com/' + resultKey + '.json')
            .then((response) => {

                let currentOptX = JSON.parse(response.body);

                const bounds = 
                [
                    {left: -10, right: 10}, 
                    {left: -10, right: 10}, 
                    {left: -10, right: 10}
                ];
                
                const N = 1000;
                    
                const msg = 
                {
                    entryPoint: handler.entryPoint,
                    codeKey: handler.codeKey,
                    data: {bounds: bounds, steps: [N, N, N], currentOptX: currentOptX}, 
                    result: resultKey
                };     
                
                comm.publish({message: msg, channel: feedbackChannel});                        
            })
            .catch(console.log);
    }
            
    return request.ok(); 
}
