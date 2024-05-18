class Simulator{
    constructor(){
        //Preload assets
        this.assets = {}
        this.loadAssets()

        //Create canvas for simulation
        let canvasParent = document.getElementById('main-canvas')
        this.canvas = createCanvas(canvasParent.clientWidth,canvasParent.clientHeight,WEBGL);
        this.canvas.parent('main-canvas');

        //Loading Shaders
        this.assets["oceanShader"] = createShader(oceanVertexShader, oceanFragmentShader);
        shader(this.assets["oceanShader"]);
        this.assets["oceanShader"].setUniform('uResolution', [width, height]);
        this.assets["oceanShader"].setUniform('fogDensity', 20000);

        //Creating camera
        this.camera = new Camera(document.getElementById('main-canvas'))

        //Creating UI
        this.ui = new UI(this);

        //FPS
        this.lastUpdate = Date.now()
        this.fps = null
        this.frameTimes = []
        this.maxFrameTimes = 10
    }

    //Automaitcally called by constructor
    loadAssets(){
        //Images
        this.assets["skybox1"] = loadImage('images/skybox1.jpg');
        this.assets["skybox2"] = loadImage('images/skybox2.jpg');
        this.assets["skybox3"] = loadImage('images/skybox3.jpg');
        this.assets["skybox4"] = loadImage('images/skybox4.jpg');
        this.assets["skybox5"] = loadImage('images/skybox-top.jpg');
        this.assets["skybox6"] = loadImage('images/skybox-bottom.jpg');
    
        //Models
        this.assets["torpedoModel"] = loadModel('models/torpedo.obj',true)
        this.assets["stationModel"] = loadModel('models/station.obj',true)
        console.log("All assets loaded")
    }

    openSimulation(simulation){
        this.simulation = simulation
        this.ui.loadSimulation(simulation)
    }
    
}

let simulator = null;

function setup() {

    simulator = new Simulator();
    simulator.openSimulation(new MeshSimulation(simulator,10,0.5))
}

function draw() {

    let now = Date.now()
    let frameTime = now - simulator.lastUpdate;
    simulator.lastUpdate = now;
    simulator.frameTimes.push(frameTime);
    if (simulator.frameTimes.length > simulator.maxFrameTimes) {
        simulator.frameTimes.shift();
    }
    let averageFrameTime = simulator.frameTimes.reduce((a, b) => a + b) / simulator.frameTimes.length;
    simulator.fps = Math.round(1000 / averageFrameTime);

    simulator.simulation.simulate();

    push();
    simulator.camera.moveToCameraPOV();
    background(0);
    simulator.simulation.draw();
    simulator.simulation.simulate()
    pop()
}

function windowResized() {
    let canvasParent = document.getElementById('main-canvas')
    resizeCanvas(canvasParent.clientWidth, canvasParent.clientHeight);
 }


function drawBackground(){
    noStroke()
    background(49,172,188);
    texture(skybox3)
    push()
    translate(0,0,-1500);
    plane(3000,3000)
    pop()
    texture(skybox2)
    push()
    rotateY(Math.PI/2)
    translate(0,0,-1500);
    plane(3000,3000)
    pop()
    texture(skybox1)
    push()
    rotateY(Math.PI)
    translate(0,0,-1500);
    plane(3000,3000)
    pop()
    texture(skybox4)
    push()
    rotateY(Math.PI*3/2)
    translate(0,0,-1500);
    plane(3000,3000)
    pop()
    texture(skybox5)
    push()
    rotateX(Math.PI/2)
    translate(0,0,-1500);
    plane(3000,3000)
    pop()
    texture(skybox6)
    push()
    rotateX(Math.PI*3/2)
    translate(0,0,-1500);
    plane(3000,3000)
    pop()
    stroke(0)
}