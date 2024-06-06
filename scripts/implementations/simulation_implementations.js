class RandomMessageSimulation extends Simulation{
    constructor(simulator,node_amount){
        super(simulator)


        this.genesisNode = null;

        for (let i = 0; i < node_amount; i++){
            let new_node = null;
            if (i==0){
                new_node = new RandomMessageNode(this,`Node ${i}`,0,0,0,true)
                this.genesisNode = new_node
            }else{
                new_node = new RandomMessageNode(this,`Node ${i}`,0,0,0,false)
            }
            this.nodeList.push(new_node)
        }

        this.genesisNode.protocolList[1].initializeBlockchain()
    }

    draw(){
        for(const node of this.nodeList){
            node.draw()
        }
    }
}



class MeshSimulation extends Simulation{
    constructor(simulator,node_amount,moving_node_ratio){
        super(simulator)

        let moving_nodes = Math.floor(node_amount*moving_node_ratio)


        this.genesisNode = null;

        for (let i = 0; i < moving_nodes; i++){
            let new_node = null;
            if (i==0){
                new_node = new ProofOfStakeNode_RandomMovement(this,`Moving Node ${i}`,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,true)
                this.genesisNode = new_node
            }else{
                new_node = new ProofOfStakeNode_RandomMovement(this,`Moving Node ${i}`,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,false)
            }
            this.nodeList.push(new_node)
        }
        for(let i = 0; i < node_amount-moving_nodes; i++){
            let new_node = new ProofOfStakeNode_Stationary(this,`Stationary Node ${i}`,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,1000*PHYSICAL_DISTANCE_MULTIPLIER,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,false)
            this.nodeList.push(new_node)
        }

        this.genesisNode.protocolList[1].initializeBlockchain()
    }


    draw(){
        for(const node of this.nodeList){
            node.draw()
        }
        translate(0,1000*PHYSICAL_DISTANCE_MULTIPLIER,0)
        rotateX(HALF_PI)
        noStroke()
        fill(255)
        this.simulator.assets["oceanShader"].setUniform("uFloorPlane",true)
        plane(10000*PHYSICAL_DISTANCE_MULTIPLIER)
        this.simulator.assets["oceanShader"].setUniform("uFloorPlane",false)

    }
}



class StaticMeshSimulation extends Simulation{
    constructor(simulator,node_amount){
        super(simulator)

        this.genesisNode = null;

        for(let i = 0; i < node_amount; i++){
            if (i == 0){
                let new_node = new ProofOfStakeNode_Stationary(this,`Stationary Node ${i}`,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,true)
                this.genesisNode = new_node
                this.nodeList.push(new_node)
            }
            let new_node = new ProofOfStakeNode_Stationary(this,`Stationary Node ${i}`,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,false)
            this.nodeList.push(new_node)
        }

        this.genesisNode.protocolList[1].initializeBlockchain()
    }


    draw(){
        for(const node of this.nodeList){
            node.draw()
        }
        translate(0,1000*PHYSICAL_DISTANCE_MULTIPLIER,0)
        rotateX(HALF_PI)
        noStroke()
        fill(255)
        this.simulator.assets["oceanShader"].setUniform("uFloorPlane",true)
        plane(10000*PHYSICAL_DISTANCE_MULTIPLIER)
        this.simulator.assets["oceanShader"].setUniform("uFloorPlane",false)

    }
}



class PipelineSimulation extends Simulation{
    constructor(simulator,node_amount){
        super(simulator)

        this.genesisNode = null;

        for(let i = 0; i < node_amount; i++){
            let new_node = new ProofOfStakeNode_Stationary(this,`Stationary Node ${i}`,(-3000 + i/node_amount *  6000)*PHYSICAL_DISTANCE_MULTIPLIER,0,(-100 + Math.random() * 200)*PHYSICAL_DISTANCE_MULTIPLIER,i==0)
            if (i==0){
                this.genesisNode = new_node
            }
            this.nodeList.push(new_node)
        }

        this.genesisNode.protocolList[1].initializeBlockchain()
    }


    draw(){
        for(const node of this.nodeList){
            node.draw()
        }

    }
}



class MuleSimulation extends Simulation{
    constructor(simulator,node_amount,moving_node_ratio){
        super(simulator)

        let moving_nodes = Math.floor((node_amount-1)*moving_node_ratio)


        this.genesisNode = null;


        for (let i = 0; i < moving_nodes; i++){
            let new_node = null;
            if (i==0){
                new_node = new ProofOfStakeNode_RandomMovement(this,`Moving Node ${i}`,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,true)
                this.genesisNode = new_node
            }else{
                new_node = new ProofOfStakeNode_RandomMovement(this,`Moving Node ${i}`,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,false)
            }
            this.nodeList.push(new_node)
        }
        for(let i = 0; i < node_amount-moving_nodes-1; i++){
            let new_node = new ProofOfStakeNode_Stationary(this,`Stationary Node ${i}`,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,1000*PHYSICAL_DISTANCE_MULTIPLIER,(-1000 + Math.random() * 2000)*PHYSICAL_DISTANCE_MULTIPLIER,false)
            this.nodeList.push(new_node)
        }

        this.nodeList.push(new ProofOfStakeNode_Mule(this, `Mule Node`,false,[new Vec3(0,1000*PHYSICAL_DISTANCE_MULTIPLIER,0),new Vec3(0,-1000*PHYSICAL_DISTANCE_MULTIPLIER,0)]))

        this.genesisNode.protocolList[1].initializeBlockchain()
    }


    draw(){
        for(const node of this.nodeList){
            node.draw()
        }

    }
}


class PresetSimulation extends Simulation{
    constructor(simulator, simulation_file){
        super(simulator)

        this.genesisNode = null;

        fetch("simulation-presets/" + simulation_file)
        .then(response =>{
            if (!response.ok){
                throw new Error("HTTP error " + response.status)
            }
            return response.json()
        })
        .then(data =>{
            if (data["nodes"] == null){
                throw new Error("Simulation file does not contain nodes")
            }
            for (const node_info of data["nodes"]){
                let new_node = null;
                let malicious = node_info["isMalicious"]
                malicious==undefined?malicious=false:null
                if (node_info["type"] == "stationary"){
                    new_node = new ProofOfStakeNode_Stationary(this,node_info["name"],node_info["x"],node_info["y"],node_info["z"],node_info["isGenesis"],malicious)
                }else if (node_info["type"] == "moving"){
                    new_node = new ProofOfStakeNode_RandomMovement(this,node_info["name"],node_info["x"],node_info["y"],node_info["z"],node_info["isGenesis"],malicious)
                }else{
                    throw new Error("Invalid node type")
                }
                if (node_info["isGenesis"]){
                    if (this.genesisNode != null){
                        throw new Error("Multiple genesis nodes found")
                    }
                    this.genesisNode = new_node
                }
                this.nodeList.push(new_node)
            }
            this.genesisNode.protocolList[1].initializeBlockchain()

            //Beacuse fetch works as a promisse we need to load the simulation after the nodes are loaded
            this.simulator.ui.loadSimulation(this)

        })
        .catch(e => {
            console.error('An error occurred while fetching the simulation file:', e);
        });
    }
}