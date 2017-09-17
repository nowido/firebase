function minimize3(f, bounds, steps, currentOptX)
{
    let minValue = currentOptX ? 
                    f(currentOptX[0], currentOptX[1], currentOptX[2]) : 
                    undefined;
    
    let xOpt = currentOptX ? currentOptX : undefined;

    let step1 = (bounds[0].right - bounds[0].left) / steps[0];
    let step2 = (bounds[1].right - bounds[1].left) / steps[1];
    let step3 = (bounds[2].right - bounds[2].left) / steps[2];
    
    let x1 = bounds[0].left;

    for(let i = 0; i < steps[0]; ++i, x1 += step1)
    {
        let x2 = bounds[1].left;

        for(let j = 0; j < steps[1]; ++j, x2 += step2)
        {
            let x3 = bounds[2].left;

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

    return xOpt;
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
    
    return minimize3(f, arg.bounds, arg.steps, arg.currentOptX);      
}
