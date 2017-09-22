function minimize(f, innerTries, currentOpt)
{
    let bounds = currentOpt.bounds;

    const dim = bounds.left.length;

    let xOpt;

    let minValue;
        
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
        stepX[i] = (bounds.right[i] - bounds.left[i]) / 2;        
    }
    
    let x = [];

    let maxCount = Math.pow(2, dim);
    
    for(let i = 0; i < maxCount; ++i)
    {
        for(let t = 0; t < innerTries; ++t)
        {
            let mask = 1;
            
            for(let j = 0; j < dim; ++j)
            {
                let b = (i & mask) ? stepX[j] : 0;
                
                x[j] = bounds.left[j] + b + Math.random() * stepX[j]; 
                
                mask <<= 1;
            }
    
            let fValue = f(x);
            
            if((fValue < minValue) || (minValue === undefined))
            {
                minValue = fValue;
    
                if(xOpt === undefined){xOpt = [];}
    
                for(let a = 0; a < dim; ++a){xOpt[a] = x[a];}
            }                            
        }
    }

    return {x: xOpt, f: minValue, bounds: bounds};
}

function test1(arg)
{    
    const a = [1, -2, -5, 3, 6, 0, 1, -1, 2, 3];

    const b = 10;
    
    function f(x)
    {       
        let fValue = b;

        const argsCount = a.length;

        for(let i = 0; i < argsCount; ++i)
        {
            let v = (x[i] - a[i]);
            fValue += v * v;
        }

        return fValue;
    }
            
    return minimize(f, arg.innerTries, arg.currentOpt);
}
