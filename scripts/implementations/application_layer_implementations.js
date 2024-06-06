class RandomMessageApplicationProtocol extends Protocol{

    constructor(node){
        super(node,"application",0,null,null)

        this.sendMessage = (message)=>{
            if(message instanceof Message){
                this.lower_protocol.sendMessage(message)
            }else if(typeof message === "string"){
                this.lower_protocol.sendMessage(new Message(this.node,message.receiver,message))
            }else{
                console.error(`[${this.node.name}]ERROR Application layer received invalid message (${message})`)
            }
        }
        
        this.handleMessageReceive = (received_message)=>{
            if (received_message.content == "DISCOVER"){
                console.log(`${this.node.name} Received discover in app layer`)
            }
            if(received_message.content === "DISCOVER_REPLY"){
                this.node.addKnownNode(received_message.sender);
            }
            disp(`Node ${this.node.name} received message "${received_message.content}"`,APPLICATION_VERBOSE)
        }

        this.broadcastMessage = (message)=>{
            disp(`[${this.node.name}][APPLICATION] broadcasting message "${message}"`,APPLICATION_VERBOSE)
            if(message instanceof Message){
                this.lower_protocol.broadcastMessage(message)
            }else if(typeof message === "string"){
                this.lower_protocol.broadcastMessage(new Message(this.node,message.receiver,message))
            }else{
                console.error("ERROR Application layer received invalid message")
                return
            }
        }
    }
}