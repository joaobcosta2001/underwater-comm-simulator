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
        this.globalBlockchain = new LocalBlockchain(null,false);


        //Overriding globalBlockchain addBlock method to track messages added to blockchain
        this.messagesAddedToBlockchain = 0
        this.messagesAddedToBlockchainTotalTime = 0
        let originalAddBlock = this.globalBlockchain.addBlock;
        this.globalBlockchain.addBlock = (block) => {
            originalAddBlock.call(this.globalBlockchain, block);
            for (const transaction of block.transactions){
                for (const message of transaction.messageList){
                    console.log("Adding message to blockchain")
                    this.messagesAddedToBlockchain += 1;
                    const delta = (Date.now()-message.creationTime)*TIME_MULTIPLIER
                    this.messagesAddedToBlockchainTotalTime += delta;
                }
            }
        };

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



class PipelineSimulation extends Simulation{
    constructor(simulator,node_amount){
        super(simulator)

        this.genesisNode = null;

        this.globalBlockchain = new LocalBlockchain(null,false)
        for(let i = 0; i < node_amount; i++){
            let new_node = new ProofOfStakeNode_Stationary(this,`Stationary Node ${i}`,(-3000 + i/node_amount *  6000)*PHYSICAL_DISTANCE_MULTIPLIER,1000*PHYSICAL_DISTANCE_MULTIPLIER,(-100 + Math.random() * 200)*PHYSICAL_DISTANCE_MULTIPLIER,i==0)
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

        this.globalBlockchain = new LocalBlockchain(null,false)

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