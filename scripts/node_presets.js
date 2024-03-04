class RandomMessageNode extends Node{

    constructor(simulation,name,x,y,z,isGenesis){
        super(simulation,name,x,y,z);
        const optical_channel_half_distance = 10000 //At 100m packets have a 50% chance of being lost
        this.addChannel(new Channel(this,"optical",225000,1000000,(d)=>{return Math.pow(Math.pow(3/2,1/optical_channel_half_distance),d)-1},optical_channel_half_distance*2)) //Light in water speed, 1Mb/s
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

        this.simulate = ()=>{

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

            //Move around
            
            //Has arrived
            if(this.position.distance2(this.target_position) < this.velocity){
                this.target_position = new Vec3(-1000+Math.random()*2000,-1000+Math.random()*2000,-1000+Math.random()*2000)
            }
            const directionVec = Vec3.directionVector(this.position,this.target_position)
            const resizeDirectionVec = directionVec.resize(this.velocity)
            this.position.add(resizeDirectionVec)

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