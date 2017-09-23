function minimize5(f, steps, currentOpt)
{
    /* exhaustive search of function minimum in 5-dimensional space */
    
    const dim = 5;

    let xOpt;

    let minValue;

    let bounds = currentOpt.bounds;
    
    let range = [];

    if(currentOpt.x)
    {
        xOpt = currentOpt.x;

        minValue = currentOpt.f;

        /* squeeze bounds */

        for(let i = 0; i < dim; ++i)
        {
            range[i] = (bounds.right[i] - bounds.left[i]) / 4;
        }

        for(let i = 0; i < dim; ++i)
        {
            bounds.left[i] = currentOpt.x[i] - range[i];
            bounds.right[i] = currentOpt.x[i] + range[i];
        }
    }

    let stepX = [];

    for(let i = 0; i < dim; ++i)
    {
        stepX[i] = (bounds.right[i] - bounds.left[i]) / steps[i];        
    }
    
    let x = [];
    let xr = [];

    x[0] = bounds.left[0];

    for(let i = 0; i < steps[0]; ++i, x[0] += stepX[0])
    {
        x[1] = bounds.left[1];

        for(let j = 0; j < steps[1]; ++j, x[1] += stepX[1])
        {
            x[2] = bounds.left[2];
            
            for(let k = 0; k < steps[2]; ++k, x[2] += stepX[2])
            {
                x[3] = bounds.left[3];

                for(let m = 0; m < steps[3]; ++m, x[3] += stepX[3])
                {
                    x[4] = bounds.left[4];

                    for(let n = 0; n < steps[4]; ++n, x[4] += stepX[4])
                    {
                        for(let sr = 0; sr < dim; ++sr)
                        {
                            xr[sr] = x[sr] + Math.random() * stepX[sr];
                        }
        
                        let fValue = f(xr);
        
                        if((fValue < minValue) || (minValue === undefined))
                        {
                            minValue = fValue;
        
                            if(xOpt === undefined){xOpt = [];}

                            for(let a = 0; a < dim; ++a){xOpt[a] = xr[a];}
                        }        
                    } /* end for x[4] */
                } /* end for x[3] */
            } /* end for x[2] */
        } /* end for x[1] */
    }  /* end for x[0] */

    return {x: xOpt, f: minValue, bounds: bounds};
}

function test1(arg)
{
    /* test function; min f(x) = f(x*) = -10; x* = {1, -2, -5, 3, 6} */
    function f(x)
    {        
        let v1 = (x[0] - 1); v1 *= v1;
        let v2 = (x[1] + 2); v2 *= v2;
        let v3 = (x[2] + 5); v3 *= v3;
        let v4 = (x[3] - 3); v4 *= v4;
        let v5 = (x[4] - 6); v5 *= v5;

        return -10 + v1 + v2 + v3 + v4 + v5;
    }
            
    return minimize5(f, arg.steps, arg.currentOpt);
}
