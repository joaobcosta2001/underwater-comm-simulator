class RandomMessageNode extends Node{

    constructor(simulation,name,x,y,z,isGenesis){
        super(simulation,name,x,y,z);
        const optical_channel_half_distance = 1000 //At 100m packets have a 50% chance of being lost
        this.addChannel(new Channel(this,"optical",225000000,1000000,optical_channel_half_distance)) //Light in water speed, 1Mb/s
        this.isGenesis = isGenesis
        //Adding protocols
        new RandomMessageApplicationProtocol(this)
        if(isGenesis){
            new BlockchainProtocolGenesis(this)
        }else{
            new BlockchainProtocol(this)
        }
        new PhysicalProtocol(this,this.channelList)

        
        this.lastMessageTime = Date.now()
        this.messageDelay = 1000 + 4000 * Math.random()
        this.target_position = new Vec3(-1000+Math.random()*2000,-1000+Math.random()*2000,-1000+Math.random()*2000)


        this.simulateMessageExchange = ()=>{
            //Send messages
            if (Date.now() - this.lastMessageTime > this.messageDelay){
                if (Math.random() < 0.5){
                    disp(`[${this.name}] sending DISCOVER`,APPLICATION_VERBOSE)
                    this.protocolList[0].broadcastMessage("DISCOVER")
                    this.lastMessageTime = Date.now()
                    this.messageDelay = 1000 + 4000 * Math.random()
                }else{
                    const receiver_node = this.getRandomKnownNode()
                    if(receiver_node != null){
                        disp(`[${this.name}] sending greetings to ${receiver_node.name}`,APPLICATION_VERBOSE)
                        this.protocolList[0].sendMessage("Hello", receiver_node)
                        this.lastMessageTime = Date.now()
                        this.messageDelay = 1000 + 4000 * Math.random()
                    }else{
                        disp(`[${this.name}] No known nodes!`,APPLICATION_VERBOSE)
                    }
                }
            }

            //Delete old messages
            for (const message of this.received_messages_buffer){
                if (Date.now()-message.arrivalTime > MESSAGE_LIFE_AFTER_ARRIVAL){
                    this.received_messages_buffer.pop(message)
                }
            }
        }


        this.simulatePhysicalMovement = ()=>{

            //Move around
            
            //Has arrived
            if(this.position.distance2(this.target_position) < this.velocity){
                this.target_position = new Vec3((-1000+Math.random()*2000)*PHYSICAL_DISTANCE_MULTIPLIER,(-1000+Math.random()*2000)*PHYSICAL_DISTANCE_MULTIPLIER,(-1000+Math.random()*2000)*PHYSICAL_DISTANCE_MULTIPLIER)
            }
            const directionVec = Vec3.directionVector(this.position,this.target_position)
            const resizeDirectionVec = directionVec.resize(this.velocity)
            this.position.add(resizeDirectionVec)
        }


        this.simulate = ()=>{

            this.simulateMessageExchange()
            this.simulatePhysicalMovement()

        }
        
    }



    getRandomKnownNode(){
        if (this.knownNodes.length == 0){
            return null
        }
        return this.knownNodes[Math.floor(Math.random() * this.knownNodes.length)]
    }


    draw(){
        push()
        translate(this.position.x,this.position.y,this.position.z)
        fill(255,255-255/30*(this.protocolList[1].mem_pool.length),255-255/30*(this.protocolList[1].mem_pool.length));
        box()
        pop()
    }
   

}




class ProofOfStakeNode extends Node{

    constructor(simulation,name,x,y,z,isGenesis){
        super(simulation,name,x,y,z);
        const optical_channel_half_distance = 1000 //At 100m packets have a 50% chance of being lost
        this.addChannel(new Channel(this,"optical",225000,1000000,optical_channel_half_distance)) //Light in water speed, 1Mb/s
        this.isGenesis = isGenesis
        new RandomMessageApplicationProtocol(this)
        if(isGenesis){
            new ProofOfStakeProtocolGenesis(this,Math.random()*1000)
        }else{
            new ProofOfStakeProtocol(this,Math.random()*1000)
        }
        new PhysicalProtocol(this,this.channelList)

        
        this.lastMessageTime = Date.now()
        this.messageDelay = 1000 + 4000 * Math.random()

        this.target_position = new Vec3(-1000+Math.random()*2000,-1000+Math.random()*2000,-1000+Math.random()*2000)
        this.deltaVec = Vec3.directionVector(this.position,this.target_position).normalize()
        this.direction = Vec3.getRotationAngles(this.deltaVec,Vec3.xVec)


        this.broadcastDiscoverMessage = ()=>{
            disp(`[${this.name}] sending DISCOVER`,APPLICATION_VERBOSE)
            this.protocolList[0].broadcastMessage("DISCOVER")

        }

        this.simulateMessageExchange = ()=>{
            //Send messages
            if (Date.now() - this.lastMessageTime > this.messageDelay){
                if (Math.random() < 0.5){
                    this.broadcastDiscoverMessage()
                }else{
                    const receiver_node = this.getRandomKnownNode()
                    if(receiver_node != null){
                        disp(`[${this.name}] sending greetings to ${receiver_node.name}`,APPLICATION_VERBOSE)
                        this.protocolList[0].sendMessage("Hello", receiver_node)
                    }else{
                        this.broadcastDiscoverMessage()
                    }
                }
                this.lastMessageTime = Date.now()
                this.messageDelay = (1000 + 4000 * Math.random())/TIME_MULTIPLIER
            }

            //Delete old messages
            for (const message of this.received_messages_buffer){
                if (Date.now()-message.arrivalTime > MESSAGE_LIFE_AFTER_ARRIVAL){
                    this.received_messages_buffer.pop(message)
                }
            }
        }

        this.simulatePhysicalMovement = ()=>{
            //Move around
            //Has arrived
            if(this.position.distance2(this.target_position) < this.velocity){
                this.target_position = new Vec3((-1000+Math.random()*2000)*PHYSICAL_DISTANCE_MULTIPLIER,(-1000+Math.random()*2000)*PHYSICAL_DISTANCE_MULTIPLIER,(-1000+Math.random()*2000)*PHYSICAL_DISTANCE_MULTIPLIER)
                this.deltaVec = Vec3.directionVector(this.position,this.target_position).normalize()
                this.direction = Vec3.getRotationAngles(this.deltaVec,Vec3.xVec)
            }
            const directionVec = Vec3.directionVector(this.position,this.target_position)
            const resizeDirectionVec = directionVec.resize(this.velocity*deltaTime/1000)
            this.position.add(resizeDirectionVec)

        }

        
        this.propertiesToDisplay = ["name","position","target_position","direction",["received_messages_buffer","length"],["knownNodes","length"],["protocolList",1,"mem_pool","length"],["protocolList",1,"blockchain","length"],["protocolList",1,"message_buffer","length"],["protocolList",1,"blockchain","currentBalances",this]]
        
    }



    getRandomKnownNode(){
        if (this.knownNodes.length == 0){
            return null
        }
        return this.knownNodes[Math.floor(Math.random() * this.knownNodes.length)]
    }


    draw(){
        //drawDebugAxis()
        //line(this.position.x,this.position.y,this.position.z,this.target_position.x,this.target_position.y,this.target_position.z)
        push()
        translate(this.position.x,this.position.y,this.position.z)
        fill(255,255-255/30*(this.protocolList[1].mem_pool.length),255-255/30*(this.protocolList[1].mem_pool.length));
        if(this.simulation.ui.selectedNode == this){
            fill(255,0,0)
        }else{
            fill(255)
        }

        if (this.model == null){
            stroke(0)
            box()
        }else{
            noStroke()
            rotateY(this.direction.x)
            rotateX(-this.direction.y)
            rotateY(Math.PI)
            model(this.model)
        }
        pop()
    }
   

}


class ProofOfStakeNode_RandomMovement extends ProofOfStakeNode{


    constructor(simulation,name,x,y,z,isGenesis){

        super(simulation,name,x,y,z,isGenesis)

        this.model = this.simulation.simulator.assets["torpedoModel"]

        this.simulatePhysicalMovement = (deltaTime)=>{
            if(this.position.distance2(this.target_position) < this.velocity*deltaTime){
                this.target_position = new Vec3((-1000+Math.random()*2000)*PHYSICAL_DISTANCE_MULTIPLIER,(-1000+Math.random()*2000)*PHYSICAL_DISTANCE_MULTIPLIER,(-1000+Math.random()*2000)*PHYSICAL_DISTANCE_MULTIPLIER)
                this.deltaVec = Vec3.directionVector(this.position,this.target_position).normalize()
                this.direction = Vec3.getRotationAngles(this.deltaVec,Vec3.xVec)
            }
            const directionVec = Vec3.directionVector(this.position,this.target_position)
            const resizeDirectionVec = directionVec.resize(this.velocity*deltaTime)
            this.position.add(resizeDirectionVec)
        }
    }
}


class ProofOfStakeNode_Stationary extends ProofOfStakeNode{


    constructor(simulation,name,x,y,z,isGenesis){

        super(simulation,name,x,y,z,isGenesis)

        this.model = this.simulation.simulator.assets["stationModel"]

        this.direction = new Vec3(0,Math.PI,0)

        this.simulatePhysicalMovement = ()=>{
            //Do nothing :)
        }
    }
}



class ProofOfStakeNode_Mule extends ProofOfStakeNode{


    constructor(simulation,name,isGenesis,pathPoints){

        super(simulation,name,pathPoints[0].x,pathPoints[0].y,pathPoints[0].z,isGenesis)

        this.model = torpedoModel

        this.pathPoints = pathPoints
        this.currentTargetPathPoint = 1
        this.target_position = this.pathPoints[this.currentTargetPathPoint]

        this.simulatePhysicalMovement = ()=>{
            if(this.position.distance2(this.target_position) < this.velocity){
                this.currentTargetPathPoint += 1
                if (this.currentTargetPathPoint >= this.pathPoints.length){
                    this.currentTargetPathPoint = 0
                }
                this.target_position = this.pathPoints[this.currentTargetPathPoint] 
                this.deltaVec = Vec3.directionVector(this.position,this.target_position).normalize()
                this.direction = Vec3.getRotationAngles(this.deltaVec,Vec3.xVec)
            }
            const directionVec = Vec3.directionVector(this.position,this.target_position)
            const resizeDirectionVec = directionVec.resize(this.velocity)
            this.position.add(resizeDirectionVec)
        }
    }
}