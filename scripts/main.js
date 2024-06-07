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

    //Automatically called by constructor
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

    setStartingSimulation(){

        MESSAGE_LIFE_AFTER_ARRIVAL = 10 //In milliseconds
        MINIMUM_TRANSACTIONS_IN_BLOCK = 30
        MESSAGE_BUFFER_SIZE = 5000 //5 messages per transaction
        DASHBOARD_UPDATE_PERIOD = 1000 //In milliseconds
        PHYSICAL_DISTANCE_MULTIPLIER = 1
        TIME_MULTIPLIER = 2
        MESSAGE_DELAY_MULTIPLIER = 0.5
        BROADCAST_PULL_PERIOD = 500
        let SIMULATION_STOP_BLOCK_COUNT = 100

        this.simulation = new PresetSimulation(this,"tetrahedron-1-malicious.json")
        this.ui.loadSimulation(this.simulation)
        this.ui.clearNodeEvents()
        this.simulation.simulate()
        this.checkSimulationEnd = ()=>{
            if (this.simulation.globalBlockchain.blocks.length > SIMULATION_STOP_BLOCK_COUNT){
                this.ui.downloadEvents(`MT-${MINIMUM_MESSAGES_IN_TRANSACTION}-TB-${MINIMUM_TRANSACTIONS_IN_BLOCK}`)
                let audio = new Audio('/assets/ping.mp3');
                audio.play();
                let throughput = (this.simulation.messagesAddedToBlockchain/this.simulation.getTime()*1000).toFixed(3)
                //this.setNextSimulationParameters(throughput)
            }else{
                setTimeout(this.checkSimulationEnd,1000)
            }
        }
        this.checkSimulationEnd()

    }
    
}

let simulator = null;

function setup() {

    simulator = new Simulator();
    simulator.setStartingSimulation()
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