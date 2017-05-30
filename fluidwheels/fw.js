//--------------------------------------------------------------------------------------------

function WorkerProc()
{
    onmessage = function(m)
    {
        postMessage(m.data + '++');
    }
}

//--------------------------------------------------------------------------------------------

$(() => 
{
    var wub = new Blob(['(' + WorkerProc.toString() + ')()'], {type : 'text/javascript'});

    var wu = URL.createObjectURL(wub);

    var w = new Worker(wu);

    URL.revokeObjectURL(wu);

    w.onmessage = function(m)
    {
        console.log(m.data);

        w.terminate();
    };

    w.postMessage('message to worker');
});

//--------------------------------------------------------------------------------------------