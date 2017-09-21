function minimize4(f, steps, currentOpt)
{
    /* exhaustive search of function minimum in three-dimensional space */
    
    let xOpt;

    let minValue;

    let bounds = currentOpt.bounds;
    
    if(currentOpt.x)
    {
        xOpt = currentOpt.x;

        minValue = currentOpt.f;

        /* squeeze bounds */

        let range1 = (bounds.right[0] - bounds.left[0]) / 4;
        let range2 = (bounds.right[1] - bounds.left[1]) / 4;
        let range3 = (bounds.right[2] - bounds.left[2]) / 4;
        let range4 = (bounds.right[3] - bounds.left[3]) / 4;

        bounds.left[0] = currentOpt.x[0] - range1;
        bounds.right[0] = currentOpt.x[0] + range1;

        bounds.left[1] = currentOpt.x[1] - range2;
        bounds.right[1] = currentOpt.x[1] + range2;

        bounds.left[2] = currentOpt.x[2] - range3;
        bounds.right[2] = currentOpt.x[2] + range3;        

        bounds.left[3] = currentOpt.x[3] - range4;
        bounds.right[3] = currentOpt.x[3] + range4;                
    }

    const step1 = (bounds.right[0] - bounds.left[0]) / steps[0];
    const step2 = (bounds.right[1] - bounds.left[1]) / steps[1];
    const step3 = (bounds.right[2] - bounds.left[2]) / steps[2];
    const step4 = (bounds.right[3] - bounds.left[3]) / steps[3];
    
    let x1 = bounds.left[0];

    for(let i = 0; i < steps[0]; ++i, x1 += step1)
    {
        let x2 = bounds.left[1];

        for(let j = 0; j < steps[1]; ++j, x2 += step2)
        {
            let x3 = bounds.left[2];
            
            for(let k = 0; k < steps[2]; ++k, x3 += step3)
            {
                let x4 = bounds.left[3];

                for(let m = 0; m < steps[3]; ++m, x4 += step4)
                {
                    let x1offset = Math.random() * step1;
                    let x2offset = Math.random() * step2;
                    let x3offset = Math.random() * step3;
                    let x4offset = Math.random() * step4;
    
                    let fValue = f(x1 + x1offset, x2 + x2offset, x3 + x3offset, x4 + x4offset);
    
                    if((fValue < minValue) || (minValue === undefined))
                    {
                        minValue = fValue;
    
                        if(xOpt === undefined)
                        {
                            xOpt = [];
                        }
    
                        xOpt[0] = x1; xOpt[1] = x2; xOpt[2] = x3; xOpt[3] = x4;
                    }    
                }
            }
        }
    }

    return {x: xOpt, f: minValue, bounds: bounds};
}

function test1(arg)
{
    /* test function; min f(x) = f(x*) = -10; x* = {1, -2, -5, 3} */
    function f(x1, x2, x3, x4)
    {
        let v1 = (x1 - 1);
        let v2 = (x2 + 2);
        let v3 = (x3 + 5);
        let v4 = (x4 - 3);

        return v1 * v1 + v2 * v2 + v3 * v3 + v4 * v4 - 10;
    }
            
    return minimize4(f, arg.steps, arg.currentOpt);
}
