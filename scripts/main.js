//Define channels

let nodeList = []

const camera = new Camera()
const simulation = new ProofOfStakeSimulation(7)
const ui = new UI()
ui.loadSimulation(simulation)


function setup() {
    let canvasParent = document.getElementById('main-canvas')
    let canvas = createCanvas(canvasParent.clientWidth,canvasParent.clientHeight,WEBGL);
    canvas.parent('main-canvas');

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
    let canvasParent = document.getElementById('main-canvas')
    resizeCanvas(canvasParent.clientWidth, canvasParent.clientHeight);
 }