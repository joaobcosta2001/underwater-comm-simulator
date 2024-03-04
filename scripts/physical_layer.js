class PhysicalProtocol extends Protocol{
    constructor(node,channelList){
        super(node,"physical",-1,null,null);

        this.chooseChannel = ()=>{
            if (this.node.channels == null){
                console.error(`ERROR channelList is null in physical protocol of node ${this.node.name}`)
            }
            return this.node.channels[0]
        }

        this.sendMessage = (message)=>{
            disp(`[${this.node.name}][PHYSICAL] sending message "${message.content}" to ${message.receiver.name}`,PHYSICAL_VERBOSE)
            const channel = this.chooseChannel();
            channel.sendMessage(message);
        }
        
        this.handleMessageReceive = (received_message)=>{
            if (received_message.content === "DISCOVER"){
                this.node.addKnownNode(received_message.sender);
                disp(`[${this.node.name}][PHYSICAL] received DISCOVER, replying`,PHYSICAL_VERBOSE)
                this.sendMessage(new Message(this.node,received_message.sender,"DISCOVER_REPLY"))
            }else{
                this.higher_protocol.handleMessageReceive(received_message)
            }
        }

        this.broadcastMessage = (message)=>{
            disp(`[${this.node.name}][PHYSICAL] broadcasting message "${message.content}"`,PHYSICAL_VERBOSE)
            if (message.content === "DISCOVER"){
                for (const receiving_node of this.node.simulation.nodeList){
                    if(receiving_node == this.node){
                        continue
                    }
                    const message_to_send = new Message(this.node,receiving_node,message.content)
                    this.sendMessage(message_to_send)
                }
            }else{
                for (const receiving_node of this.node.knownNodes){
                    if(receiving_node == this.node){
                        continue
                    }
                    const message_to_send = new Message(this.node,receiving_node,message.content)
                    this.sendMessage(message_to_send)
                }
            }
        }
    }
}