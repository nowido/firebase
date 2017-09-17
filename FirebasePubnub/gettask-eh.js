export default (request) => 
{ 
    // this handler is on 'worker_ready' channel
    
    const comm = require('pubnub'); 
    const xhr = require("xhr"); 
        
    function prepareOptTask(descriptor, destinationChannel)
    {
        const dbPrefix = 'https://fluidfunctions.firebaseio.com/';
        
        let resultKey = 'results/' + descriptor.codeKey;
        
        xhr.fetch(dbPrefix + resultKey + '.json')
        .then((response) => {

            let currentOpt = JSON.parse(response.body);

            const bounds = {left: [-10, -10, -10], right: [10, 10, 10]};                
            const N = 1000;
                
            const msg = 
            {
                entryPoint: descriptor.entryPoint,
                codeKey: descriptor.codeKey,
                data: {bounds: bounds, steps: [N, N, N], currentOpt: currentOpt}, 
                result: resultKey
            };     
            
            comm.publish({message: msg, channel: destinationChannel});                        
        })
        .catch(console.log);        
    }

    function prepareMonteCarloTask(descriptor, destinationChannel)
    {
        const N = 1000000000; // 1 billion of random points to calc
        
        const msg = 
        {
            entryPoint: descriptor.entryPoint,
            codeKey: descriptor.codeKey,
            data: {pointsCount: N}, 
            result: 'pi'
        };     

        comm.publish({message: msg, channel: destinationChannel});                        
    }

    const handlers = 
    [
        {entryPoint: 'test1', codeKey: 'test1', taskBuilder: prepareOptTask},
        {entryPoint: 'test2', codeKey: 'test2', taskBuilder: prepareOptTask},
        {entryPoint: 'test3', codeKey: 'test3', taskBuilder: prepareMonteCarloTask}
    ];

    const feedbackChannel = request.message.feedbackChannel;

    if(feedbackChannel && (feedbackChannel.length > 0))
    {
        let index = Math.floor(Math.random() * handlers.length);
        
        handlers[index].taskBuilder(handlers[index], feedbackChannel);
    }
            
    return request.ok(); 
}
