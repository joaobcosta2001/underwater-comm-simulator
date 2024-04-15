//Define channels

let nodeList = []

const camera = new Camera(document.getElementById('main-canvas'))
const simulation = new ProofOfStakeSimulation(15)
const ui = new UI()
ui.loadSimulation(simulation)

let skybox1 = null, skybox2 = null, skybox3 = null, skybox4 = null, skybox5 = null, skybox6 = null;

let torpedoModel = null

function setup() {
    let canvasParent = document.getElementById('main-canvas')
    let canvas = createCanvas(canvasParent.clientWidth,canvasParent.clientHeight,WEBGL);
    canvas.parent('main-canvas');

    simulation.setup()

    skybox1 = loadImage('images/skybox1.jpg');
    skybox2 = loadImage('images/skybox2.jpg');
    skybox3 = loadImage('images/skybox3.jpg');
    skybox4 = loadImage('images/skybox4.jpg');
    skybox5 = loadImage('images/skybox-top.jpg');
    skybox6 = loadImage('images/skybox-bottom.jpg');

    torpedoModel = loadModel('models/torpedo.obj',true)
}

function draw() {
    push()
    camera.moveToCameraPOV()

    //Draw background

    drawBackground()



    simulation.simulate()
    simulation.draw()
    pop()
}

function windowResized() {
    let canvasParent = document.getElementById('main-canvas')
    resizeCanvas(canvasParent.clientWidth, canvasParent.clientHeight);
 }


function drawBackground(){
    noStroke()
    background(49,172,188);
    texture(skybox1)
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
    texture(skybox3)
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