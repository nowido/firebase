export default (request) => 
{ 
    // this handler is on 'take_result' channel

    const kvstore = require('kvstore');
    const comm = require('pubnub');  
    
    const accChannel = 'acc_results';

    const task_id = request.message.task_id;
    const mcpi = request.message.mcpi;

    kvstore.get(task_id).then((value) => 
    {
        if(value)
        {
            const N = value.count;

            comm.publish
            ({
                channel: accChannel, 
                message: {count: N, mcpi: mcpi}
            });

            //const info = 'task_id: ' + task_id + ' mcpi: ' + mcpi + ' (N = ' + N + ')'; 
            //console.log(info);        
        }
    });
            
    return request.ok(); 
}