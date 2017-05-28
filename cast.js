//--------------------------------------------------------------------------------------------

$(() => 
{
    var myFbKeyElement = $('#myFbKey');
    var sinkFbKeyElement = $('#sinkFbKey');

    var buttonStartElement = $('#buttonStart');

    var textToCastElement = $('#textToCast');

    var buttonCastElement = $('#buttonCast');

    var my;
    var sinkKey;
    
    var fsink;

    buttonStartElement.click(() => 
    {
        my = myFbKeyElement.val();
        sinkKey = sinkFbKeyElement.val();
        
        fsink = new FluidSink(sinkKey);

        myFbKeyElement.prop('disabled', true);
        sinkFbKeyElement.prop('disabled', true);
        
        buttonStartElement.prop('disabled', true);       
        buttonCastElement.prop('disabled', false);       

        document.title = 'Fluid Cast (' + my + ' -> ' + sinkKey + ')';  
    });

    buttonCastElement.click(() => 
    {
        fsink.cast(my + ':' + textToCastElement.val());

        textToCastElement.val('');
    });

    textToCastElement.on('keydown', (e) => 
    {
        if(e.originalEvent.code === "Enter")
        {
            fsink.cast(my + ':' + textToCastElement.val());
            
            textToCastElement.val('');
        }        
    });    
});

//--------------------------------------------------------------------------------------------
