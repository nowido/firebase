//------------------------------------------------------------------------------

function startRenderAnimation(playground)
{
    function renderFrame()
    {
        var phase = playground.material.uniforms.phase.value + 0.01;
        
        if(phase > playground.PI2)
        {
            phase -= playground.PI2;
        }
        
        playground.material.uniforms.phase.value = phase; 
        
        var rotation = playground.scene.rotation.z + 0.001;
        
        if(rotation > playground.PI2)
        {
            rotation -= playground.PI2;
        }
        
        playground.scene.rotation.z = rotation;
     
        playground.renderer.render(playground.scene, playground.camera);
        
        requestAnimationFrame(renderFrame);
    }
    
    renderFrame();
}

//------------------------------------------------------------------------------

function fillScene(playground)
{
    playground.scene = new THREE.Scene();
    playground.scene.background = new THREE.Color(1, 1, 1);
    
    var geometry = new THREE.BufferGeometry();

    var trianglesCount = 2 * playground.rows * playground.columns;
    var verticesCount = 3 * trianglesCount;
    
    var vertexIndices = new Float32Array(verticesCount);
    
    for(var i = 0; i < verticesCount; ++i)
    {
        vertexIndices[i] = i;
    }
    
        // fake positions (all zero); used by THREE internals, not needed to WebGl itself
        //  this attribute is not used in our shaders
    var positionsArray = new Float32Array(verticesCount * 3);
    geometry.addAttribute('position', new THREE.BufferAttribute(positionsArray, 3, false));
            
        // the only attribute input to our vertex shader
    geometry.addAttribute('vindex', new THREE.BufferAttribute(vertexIndices, 1, false));
    
        //
    
    var vsCode = document.getElementById(playground.vsId).textContent;
    var psCode = document.getElementById(playground.psId).textContent;
    
        //
    
    var shaderingOptions = 
    {
        defines: 
        {
            ROWS: playground.rows,
            COLS: playground.columns
        },
        
        uniforms: 
        {
            phase: {type: '1f', value: Math.random()}
        },
        
        vertexShader: vsCode,
        fragmentShader: psCode
    };
    
    playground.material = new THREE.ShaderMaterial(shaderingOptions);

        //
    
    playground.mesh = new THREE.Mesh(geometry, playground.material);

    playground.scene.add(playground.mesh);    
    
        //
    
    playground.scene.rotation.x = -0.5;
}

//------------------------------------------------------------------------------

function setupCamera(playground)
{
    var surfaceSize = playground.renderer.getSize();

    var fov = 45,
    aspect = surfaceSize.width / surfaceSize.height;

    playground.camera = new THREE.PerspectiveCamera(fov, aspect, 1, 1000);
    
    playground.camera.lookAt(new THREE.Vector3(0, 0, 0));
    
    playground.camera.position.z = 3;
}

//------------------------------------------------------------------------------

function setupRenderer(playground)
{
    var rendererOptions = 
    {
        antialias: true    
    };
    
    playground.renderer = new THREE.WebGLRenderer(rendererOptions);

    playground.renderer.setSize(playground.surfaceWidth, playground.surfaceHeight);
    
    gl = playground.renderer.context;
    gl.disable(gl.CULL_FACE);

    $(playground.renderer.domElement).addClass('center-block');

    playground.surfaceContainer.append(playground.renderer.domElement);    
}

//------------------------------------------------------------------------------

function prepareStuff(playground)
{
    playground.surfaceContainer = $('#surfaceContainer');

    playground.surfaceWidth = Math.floor(2 * playground.surfaceContainer.innerWidth() / 3);
    playground.surfaceHeight = Math.floor(2 * playground.surfaceWidth / 3);

    playground.rows = 200;
    playground.columns = 200;
        
    playground.vsId = 'vs_scene_builder';
    playground.psId = 'ps_colorizer';
        
    playground.PI2 = 2 * Math.PI;

        //
        
    setupRenderer(playground);
    
    setupCamera(playground);
    
    fillScene(playground);
    
    startRenderAnimation(playground);        
}

//------------------------------------------------------------------------------

$(() =>
{
    prepareStuff({});    
});

//------------------------------------------------------------------------------