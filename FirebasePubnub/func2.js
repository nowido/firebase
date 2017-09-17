function minimize3(f, bounds, steps, currentOpt)
{
    let xOpt = currentOpt ? currentOpt.x : undefined;
    
    let minValue = currentOpt ? currentOpt.f : undefined;
        
    const step1 = (bounds.right[0] - bounds.left[0]) / steps[0];
    const step2 = (bounds.right[1] - bounds.left[1]) / steps[1];
    const step3 = (bounds.right[2] - bounds.left[2]) / steps[2];
    
    let x1 = bounds.left[0];

    for(let i = 0; i < steps[0]; ++i, x1 += step1)
    {
        let x2 = bounds.left[1];

        for(let j = 0; j < steps[1]; ++j, x2 += step2)
        {
            let x3 = bounds.left[2];

            for(let k = 0; k < steps[2]; ++k, x3 += step3)
            {
                let x1offset = Math.random() * step1;
                let x2offset = Math.random() * step2;
                let x3offset = Math.random() * step3;

                let fValue = f(x1 + x1offset, x2 + x2offset, x3 + x3offset);

                if((fValue < minValue) || (minValue === undefined))
                {
                    minValue = fValue;

                    if(xOpt === undefined)
                    {
                        xOpt = [];
                    }

                    xOpt[0] = x1; xOpt[1] = x2; xOpt[2] = x3;
                }
            }
        }
    }

    return {x: xOpt, f: minValue};
}

function test2(arg)
{
    function f(x1, x2, x3)
    {
        let v1 = (x1 + 1);
        let v2 = (x2 - 3);
        let v3 = (x3 - 1);

        return v1 * v1 + v2 * v2 + v3 * v3 + 2;
    }
    
    return minimize3(f, arg.bounds, arg.steps, arg.currentOpt);      
}
