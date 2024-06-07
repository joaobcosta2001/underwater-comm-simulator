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

        
        this.lastMessageTime = this.simulation.getTime()
        this.messageDelay = 1000 + 4000 * Math.random()
        this.target_position = new Vec3(-1000+Math.random()*2000,-1000+Math.random()*2000,-1000+Math.random()*2000)


        this.simulateMessageExchange = ()=>{
            //Send messages
            if (this.simulation.getTime() - this.lastMessageTime > this.messageDelay){
                if (Math.random() < 0.5){
                    disp(`[${this.name}] sending DISCOVER`,APPLICATION_VERBOSE)
                    this.protocolList[0].broadcastMessage("DISCOVER")
                    this.lastMessageTime = this.simulation.getTime()
                    this.messageDelay = 1000 + 4000 * Math.random()
                }else{
                    if (this.protocolList[1].blockchain.availableBalance > LOW_BALANCE_THRESHOLD){
                        const receiver_node = this.getRandomKnownNode()
                        if(receiver_node != null){
                            disp(`[${this.name}] sending greetings to ${receiver_node.name}`,APPLICATION_VERBOSE)
                            this.protocolList[0].sendMessage("Hello", receiver_node)
                            this.lastMessageTime = this.simulation.getTime()
                            this.messageDelay = 1000 + 4000 * Math.random()
                        }else{
                            disp(`[${this.name}] No known nodes!`,APPLICATION_VERBOSE)
                        }
                    }
                }
            }

            //Delete old messages
            for (const message of this.received_messages_buffer){
                if (this.simulation.getTime()-message.arrivalTime > MESSAGE_LIFE_AFTER_ARRIVAL){
                    let index = this.received_messages_buffer.indexOf(message);
                    if (index > -1) {
                        this.received_messages_buffer.splice(index, 1);
                    }
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

    constructor(simulation,name,x,y,z,isGenesis,isMalicious=false){
        super(simulation,name,x,y,z);
        const optical_channel_half_distance = 900 //At half_distance packets have a 50% chance of being lost
        this.addChannel(new Channel(this,"optical",225000,1000000,optical_channel_half_distance)) //Light in water speed, 1Mb/s
        this.isGenesis = isGenesis
        new RandomMessageApplicationProtocol(this)
        if(isGenesis){
            new ProofOfStakeProtocolGenesis(this)
        }else{
            new ProofOfStakeProtocol(this,isMalicious)
        }
        new PhysicalProtocol(this,this.channelList)

        
        this.lastMessageTime = this.simulation.getTime()
        this.messageDelay = (MESSAGE_DELAY_MINIMUM + MESSAGE_DELAY_VARIABILITY * Math.random())*MESSAGE_DELAY_MULTIPLIER

        this.target_position = new Vec3(-1000+Math.random()*2000,-1000+Math.random()*2000,-1000+Math.random()*2000)
        this.deltaVec = Vec3.directionVector(this.position,this.target_position).normalize()
        this.direction = Vec3.getRotationAngles(this.deltaVec,Vec3.xVec)


        this.broadcastDiscoverMessage = ()=>{
            disp(`[${this.name}] sending DISCOVER`,APPLICATION_VERBOSE)
            this.protocolList[0].broadcastMessage("DISCOVER")

        }

        this.sendDiscovery = true

        this.simulateMessageExchange = ()=>{
            if (this.simulation.getTime() - this.lastMessageTime > this.messageDelay){
                
                //this.simulation.simulator.ui.addNodeEvent(this,"Created message (" + this.simulation.getTime() + "-" + this.lastMessageTime + "=" + (this.simulation.getTime()-this.lastMessageTime) + ">" + this.messageDelay + ")")
                if (this.sendDiscovery){
                    this.broadcastDiscoverMessage()
                    this.sendDiscovery = false
                }else{
                    const receiver_node = this.getRandomKnownNode()
                    if(receiver_node != null){
                        disp(`[${this.name}] sending greetings to ${receiver_node.name}`,APPLICATION_VERBOSE)
                        this.protocolList[0].sendMessage("Hello", receiver_node)
                    }else{
                        this.broadcastDiscoverMessage()
                    }
                    this.sendDiscovery = true
                }
                this.lastMessageTime = this.simulation.getTime()
                this.messageDelay = (MESSAGE_DELAY_MINIMUM + MESSAGE_DELAY_VARIABILITY * Math.random())*MESSAGE_DELAY_MULTIPLIER
            }

            //Delete old messages
            for (const message of this.received_messages_buffer){
                if (this.simulation.getTime()-message.arrivalTime > MESSAGE_LIFE_AFTER_ARRIVAL){
                    let index = this.received_messages_buffer.indexOf(message);
                    if (index > -1) {
                        this.received_messages_buffer.splice(index, 1);
                    }
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

        this.degree = null
        this.propertiesToDisplay = ["name","position","target_position","direction",["received_messages_buffer","length"],["knownNodes","length"],["protocolList",1,"mem_pool","length"],["protocolList",1,"blockchain","length"],["protocolList",1,"message_buffer","length"],"degree"]
        
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


    constructor(simulation,name,x,y,z,isGenesis,isMalicious=false){

        super(simulation,name,x,y,z,isGenesis,isMalicious)

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


    constructor(simulation,name,x,y,z,isGenesis,isMalicious=false){

        super(simulation,name,x,y,z,isGenesis,isMalicious)

        this.model = this.simulation.simulator.assets["stationModel"]

        this.direction = new Vec3(0,Math.PI,0)

        this.simulatePhysicalMovement = ()=>{
            //Do nothing :)
        }
    }
}



class ProofOfStakeNode_Mule extends ProofOfStakeNode{


    constructor(simulation,name,isGenesis,pathPoints,isMalicious=false){

        super(simulation,name,pathPoints[0].x,pathPoints[0].y,pathPoints[0].z,isGenesis,isMalicious)

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