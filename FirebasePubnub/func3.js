function test3(arg)
{
    function calcMonteCarloPi(pointsCount)
    {
        let inCircleCount = 0;

        for (let i = 0; i < pointsCount; ++i)
        {
            let x = Math.random();
            let y = Math.random();

            if(x * x + y * y < 1)
            {
                ++inCircleCount;
            }
        }
        
        return 4 * inCircleCount / pointsCount;       
    }
    
    return calcMonteCarloPi(arg.pointsCount);
}
