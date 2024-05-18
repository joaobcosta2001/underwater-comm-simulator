class Protocol{

    constructor(node,layer,protocolPosition,sendMessage,handleMessageReceive){
        this.node = node
        //Layer can be something like "application", "security", "transport" or "physical"
        this.layer = layer;
        //Function that takes a message and outputs a processed version of that same message, to emulate the protocol's behavior
        this.sendMessage = sendMessage;
        this.handleMessageReceive = handleMessageReceive
        this.higher_protocol = null
        this.lower_protocol = null
        this.node.addProtocol(this, protocolPosition)
    }

}


class Message{
    constructor(sender,receiver, content){
        this.sender = sender;
        this.receiver = receiver;
        this.content = content;
        if (typeof this.content === "string"){
            this.length = 128+128+this.content.length*8
        }else if (typeof this.content === "object"){
            this.length = 128+128+100*8
        }else{
            this.length = 128+128+256
        }
        this.creationTime = Date.now();
        this.sendingTime = null;
        this.arrivalTime = null;
    }
}


class Channel{

    constructor(node,name,propagation_speed,transfer_speed,half_distance){
        this.node = node
        this.name = name
        //Constant that expresses how many meters a signal travels in one second (in meters per second)
        this.propagation_speed = propagation_speed;
        //Constant that expresses how many bits can the node put in the communication channel per second (in bits per second)
        this.transfer_speed = transfer_speed;
        //Probabilistic function that takes distance and outputs message error ratio
        this.half_distance = half_distance;
    }

    //Wether a message can go through
    hasConnectivity(distance){
        let randomValue = Math.random()
        return (randomValue < 1-0.5/Math.pow(this.half_distance,2)*Math.pow(distance,2)) 
    }

    withinRange(node2){
        return Vec3.distance(this.node.position, node2.position) < 1.4142 * this.half_distance //sqrt(2)
    }

    sendMessage(message){
        disp(`[${this.node.name}][CHANNEL ${this.name}] sending message ${message.content} to ${message.receiver.name}`,CHANNEL_VERBOSE)
        let distance = Node.getDistance(message.sender,message.receiver) //calculate distance
        //Simulate errors
        if (!this.hasConnectivity(distance)){
            disp(`[${this.node.name}][CHANNEL ${this.name}] message ${message.content} failed to reach ${message.receiver.name} (distance=${distance})`,CHANNEL_VERBOSE)
            return false;
        }
        //Calculate delay
        let delay = distance / this.propagation_speed + message.length / this.transfer_speed;
        message.sendingTime = Date.now();
        //Send message with calculated delay
        setTimeout(()=>{
            disp(`[${this.node.name}][CHANNEL ${this.name}] Message ${message.content} arrived to ${message.receiver.name}`,CHANNEL_VERBOSE)
            message.receiver.handleMessageReceive(message)
            message.receiver.received_messages_buffer.push(message);
            message.arrivalTime = Date.now()
        },delay*1000/TIME_MULTIPLIER)
        return true;
    }

    getNodeDegree(nodeList){
        let degree = 0
        for (const node of nodeList){
            if (node == this.node){
                continue
            }
            if (this.withinRange(node)){
                degree += 1
            }
        }
        return degree
    }

}


class Node{

    constructor(simulation,name,x,y,z){
        this.simulation = simulation
        this.name = name;
        this.protocolList = [];
        this.position = new Vec3(x,y,z);
        this.velocity = 0.1;
        this.direction = new Vec3(0,0,0);
        this.direction.type = "angle"
        this.received_messages_buffer = []
        this.channels = []
        this.knownNodes = []
        this.propertiesToDisplay = ["name","position",["received_messages_buffer","length"],["knownNodes","length"]]
        this.events = []
        this.model = null
        this.lastSimulateTimestamp = Date.now()
    }

    addProtocol(protocol,i = -1){
        if (i == -1){
            protocol.higher_protocol = this.protocolList[this.protocolList.length-1]
            this.protocolList[this.protocolList.length-1].lower_protocol = protocol
            this.protocolList.push(protocol)
        }else{
            this.protocolList.splice(i,0,protocol)
            if (i > 0){
                this.protocolList[i-1].lower_protocol = protocol
                protocol.higher_protocol = this.protocolList[i-1]
            }
            if (i < this.protocolList.length-1){
                this.protocolList[i+1].higher_protocol_protocol = protocol
                protocol.higher_protocol = this.protocolList[i+1]
            }
        }
    }

    addChannel(channel){
        this.channels.push(channel);
    }

    addKnownNode(node){
        if (!this.knownNodes.includes(node)) {
            this.knownNodes.push(node);
        }
    }


    //TODO REWRITE THIS FUNCTION
    //Send string 'message' to node 'receiver'
    sendMessage(content,receiver){
        if (content == null || receiver == null){
            console.log("ERROR sendMessage received an invalid message or receiver")
        }
        if (this.protocolList.length == 0){
            console.log("ERROR attempt to send message but no protocol layers were defined")
        }

        let current_message = new Message(this,receiver,content);
        for (const element of this.protocolList){
            current_message = element.processMessage(current_message)
        }

        if (this.protocolList[this.protocolList.length-1].layer == "physical"){
            let chosen_channel = this.protocolList[this.protocolList.length-1].chooseChannel(this.channels)
            chosen_channel.sendMessage(current_message,this,receiver);
        }else{
            console.log(`ERROR No physical layer detected! Cannot send message ${message} to node ${receiver.name}`)
        }
    }

    static getDistance(node1,node2){
        let d =  Vec3.distance(node1.position,node2.position)
        return d;   
    }

    handleMessageReceive(message){
        this.protocolList[this.protocolList.length-1].handleMessageReceive(message)
    }


    getRandomKnownNode(){
        return this.knownNodes[Math.floor(Math.random()*this.knownNodes.length)]
    }

    draw(){
        push()
        translate(this.position.x,this.position.y,this.position.z)
        box()
        pop()
        for (const message of this.received_messages_buffer){
            stroke(Math.floor(255*(1-(Date.now()-message.arrivalTime)/1000)),0,0)
            line(message.sender.position.x,message.sender.position.y,message.sender.position.z,message.receiver.position.x,message.receiver.position.y,message.receiver.position.z)
        }
        stroke(0,0,0)
    }

    simulateMessageExchange(){
        console.log("simulateMessageExchange() is not implemented for this node")
    }

    simulatePhysicalMovement(){
        console.log("simulatePhysicalMovement() is not implemented for this node")
    }

    simulate(){
        let now = Date.now()
        let deltaTime = (now-this.lastSimulateTimestamp)*TIME_MULTIPLIER
        this.lastSimulateTimestamp = now
        this.simulateMessageExchange(deltaTime)
        this.simulatePhysicalMovement(deltaTime)
    }
}


class Simulation{

    constructor(simulator){
        this.simulator = simulator
        this.nodeList = []
        this.speed = 1
        this.startTime = Date.now()
        this.lastRegisteredTime = Date.now()
        this.totalSimulationTime = 0 //In milliseconds
        this.state = "playing"
        this.ui = null;

        this.pausedDueToVisibilityChange = false
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
                this.pausedDueToVisibilityChange = true
            } else if(this.pausedDueToVisibilityChange) {
                this.play();
            }
        });
    }

    pause(){
        this.state = "paused"
    }
    play(){
        this.state = "playing"
        this.lastRegisteredTime = Date.now()
    }

    getElapsedTime(){
        return this.totalSimulationTime
    }

    simulate(){
        if(this.state == "paused"){
            return
        }
        let now = Date.now()
        let deltaTime = (now-this.lastRegisteredTime)*TIME_MULTIPLIER
        this.lastRegisteredTime = now
        this.totalSimulationTime += deltaTime
        for (const node of this.nodeList){
            node.simulate()
        }
    }

    draw(){
        for(const node of this.nodeList){
            node.draw()
        }
    }

    getRandomNode(){
        return this.nodeList[Math.floor(Math.random()*this.nodeList.length)]
    }

    getNodeByName(name){
        for (const node of this.nodeList){
            if (node.name == name){
                return node
            }
        }
        return null
    }

}