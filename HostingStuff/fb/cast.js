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
        var textToCast = textToCastElement.val();

        if(textToCast)
        {
            fsink.cast(my + ':' + textToCast);

            textToCastElement.val('');
        }        
    });
});

//--------------------------------------------------------------------------------------------