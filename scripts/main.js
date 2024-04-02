//Define channels

let nodeList = []

const camera = new Camera()
const simulation = new RandomMessageSimulation(7)


function setup() {
    createCanvas(window.innerWidth, window.innerHeight,WEBGL);
    simulation.setup()
}

function draw() {
    push()
    camera.moveToCameraPOV()
    background(0,0,0);
    simulation.simulate()
    simulation.draw()
    pop()
}

function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
 }