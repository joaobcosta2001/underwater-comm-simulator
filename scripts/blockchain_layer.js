class MessageBuffer{
    constructor(size){
        this.size = size //in bits
        this.current_occupancy = 0
        this.messages = []
        this.total_message_count = 0
        this.total_message_size = 0
        this.avg_message_size = 0
        this.length = 0
    }

    flush(){
        let mess_buf = this.messages
        this.messages = []
        this.length = 0
        this.current_occupancy = 0
        return mess_buf
    }

    push(message){
        this.messages.push(message)
        this.current_occupancy += message.length
        this.total_message_count+=1;
        this.length += 1
        this.total_message_size += message.length
        this.avg_message_size = this.total_message_size/this.total_message_count
    }

    checkAlmostFull(){
        return this.size-this.avg_message_size < this.current_occupancy
    }
}


class BlockchainTransaction{
    constructor(sendingNode,messageList){
        this.sendingNode = sendingNode
        this.messageList = messageList
    }
}

class ProofOfStakeTransaction{
    constructor(sendingNode,messageList,fee){
        this.sendingNode = sendingNode
        this.messageList = messageList
        this.fee = fee
    }
}


class BlockchainBlock{
    constructor(transactions,proposer,nextProposer,order_number){
        this.transactions = transactions
        this.proposer = proposer
        this.nextProposer = nextProposer
        this.order_number = order_number
    }
}

class LocalBlockchain{
    constructor(node,genesisNode){
        this.node = node
        this.blocks = []
        this.length = 0
        if (genesisNode != null){
            this.addBlock(new BlockchainBlock([],this.node,genesisNode,0))
        }
        this.order_number = 0
    }

    findBlock(order_number){
        for (const block of this.blocks){
            if (block.order_number == order_number){
                return block
            }
        }
        return null
    }

    addBlock(block){
        if(this.findBlock(block.order_number) == null){
            this.blocks.splice(block.order_number,0,block)
            this.order_number = this.blocks[this.blocks.length-1].order_number
            this.length = this.blocks.length
        }
    }
}




class BlockchainProtocol extends Protocol{

    constructor(node){
        super(node,"security",1,null,null);
        this.message_buffer = new MessageBuffer(800) //1000 bytes
        this.mem_pool = []
        this.blockchain = new LocalBlockchain(node,null)
        this.block_to_propose = null;
    

        

        this.createBlock = ()=>{
            const proposer = this.chooseNextProposer();
            const transactions = this.chooseTransactions();
            this.blockchain.order_number += 1;
            const orderNumber = this.blockchain.order_number;
            disp(`[${this.node.name}] Proposing new block (nextProposer=${proposer.name}|orderNumber=${orderNumber})`,BLOCK_VERBOSE)
            return new BlockchainBlock(transactions,this.node,proposer,orderNumber)
        }

        this.chooseNextProposer = ()=>{
            return this.node.getRandomKnownNode();
        }

        this.chooseTransactions = ()=>{
            const mem_pool_copy = this.mem_pool
            this.mem_pool = []
            return mem_pool_copy
        }


        this.sendMessage = (message)=>{
            disp(`[${this.node.name}][BLOCKCHAIN] adding message "${message.content}" to message buffer`,BLOCKCHAIN_VERBOSE)
            this.message_buffer.push(message)
            if (this.message_buffer.checkAlmostFull()){
                disp(`[${this.node.name}][BLOCKCHAIN] message buffer full, creating transaction`,BLOCKCHAIN_VERBOSE)
                let messages_for_transaction = this.message_buffer.flush()
                let new_transaction = new BlockchainTransaction(message.sender,messages_for_transaction)
                this.mem_pool.push(new_transaction)
                this.lower_protocol.broadcastMessage(new Message(this.node, null,new_transaction))
            }
        }

        this.broadcastMessage = (message)=>{
            disp(`[${this.node.name}][BLOCKCHAIN] broadcasting message "${message.content}"`,BLOCKCHAIN_VERBOSE)
            this.lower_protocol.broadcastMessage(message)
        }

        this.handleDiscoverReceive = (received_message)=>{
            this.higher_protocol.handleMessageReceive(received_message)
        }

        this.handleTransactionReceive = (transaction)=>{
            disp(`[${this.node.name}][BLOCKCHAIN] transaction received from ${transaction.sendingNode.name}`,BLOCKCHAIN_VERBOSE)
        }

        this.handleBlockReceive = (block)=>{
            disp(`[${this.node.name}][BLOCKCHAIN] block received from ${block.proposer.name} (nextProposer=${block.nextProposer.name})`.BLOCKCHAIN_VERBOSE || BLOCK_VERBOSE)
        }

        this.handleMessageReceive = (received_message)=>{
            if (received_message.content instanceof BlockchainTransaction){
                this.handleTransactionReceive(received_message.content)
            }else if(received_message.content instanceof BlockchainBlock){
                this.handleBlockReceive(received_message.content)
            }else if( received_message.content === "DISCOVER_REPLY"){
                this.handleDiscoverReceive(received_message)
            }else{
                console.warn("WARNING security layer received a message that does not contain a transaction nor a block")
                this.higher_protocol.handleMessageReceive(received_message)
            }
        }

        this.initializeBlockchain = ()=>{
            console.error("A non genesis node was asked to initialize the blockchain!")
        }
    }
}



class BlockchainProtocolGenesis extends BlockchainProtocol{
    constructor(node){
        super(node);
        this.firstDiscoverReceived = false
        this.blockchain = new LocalBlockchain(this.node,this.node)

        this.handleDiscoverReceive = (received_message)=>{
            if (!this.firstDiscoverReceived){
                const new_block = this.createBlock();
                this.broadcastMessage(new Message(this.node,null,new_block));
                this.firstDiscoverReceived = true
            }
            this.higher_protocol.handleMessageReceive(received_message)
        }

        this.initializeBlockchain = ()=>{
            this.broadcastMessage(new Message(this.node,null,"discover"))
        }

        disp(`[${this.node.name}] I'm a genesis node!`,BLOCK_VERBOSE)
    }

}


class ProofOfStakeProtocol extends BlockchainProtocol{

    constructor(node){
        super(node);
        this.block_to_propose = null;

        this.createBlock = ()=>{
            const proposer = this.chooseNextProposer();
            const transactions = this.chooseTransactions();
            this.blockchain.order_number += 1;
            const orderNumber = this.blockchain.order_number;
            disp(`[${this.node.name}] Proposing new block (nextProposer=${proposer.name}|orderNumber=${orderNumber})`,BLOCK_VERBOSE)
            return new BlockchainBlock(transactions,this.node,proposer,orderNumber)
        }

        this.chooseNextProposer = ()=>{
            return this.node.getRandomKnownNode();
        }

        this.chooseTransactions = ()=>{
            const mem_pool_copy = this.mem_pool
            this.mem_pool = []
            return mem_pool_copy
        }


        this.handleTransactionReceive = (transaction)=>{
            disp(`[${this.node.name}][BLOCKCHAIN] transaction received from ${transaction.sendingNode.name}`,BLOCKCHAIN_VERBOSE || TRANSACTION_VERBOSE)
            if (this.mem_pool.indexOf(transaction) == -1){
                this.mem_pool.push(transaction)
            }

            if (this.block_to_propose != null && this.mem_pool.length >= MINIMUM_TRANSACTIONS_IN_BLOCK){
                console.log(`[${this.node.name}] Previous block next proposer is ${this.block_to_propose.nextProposer.name} and mem_pool full. Proposing new block`)
                this.block_to_propose = null
                const new_block = this.createBlock();
                this.broadcastMessage(new Message(this.node,null,new_block));
            } 
        }

        this.handleBlockReceive = (block)=>{
            disp(`[${this.node.name}][BLOCKCHAIN] block received from ${block.proposer.name} (nextProposer=${block.nextProposer.name})`,BLOCKCHAIN_VERBOSE || BLOCK_VERBOSE)
            for (const transaction of block.transactions){
                const transaction_index = this.mem_pool.indexOf(transaction)
                if (transaction_index != -1){
                    this.mem_pool.splice(transaction_index,1)
                }
            }
            this.blockchain.addBlock(block)

            //TODO Report messages to application layer

            if (block.nextProposer == this.node){
                if(this.mem_pool.length >= MINIMUM_TRANSACTIONS_IN_BLOCK){
                    const new_block = this.createBlock();
                    this.broadcastMessage(new Message(this.node,null,new_block));
                }else{
                    this.block_to_propose = block
                }
            }
        }
    }
}

class ProofOfStakeProtocolGenesis extends ProofOfStakeProtocol{
    constructor(node){
        super(node)
        this.firstDiscoverReceived = false
        this.blockchain = new LocalBlockchain(this.node,this.node)

        this.handleDiscoverReceive = (received_message)=>{
            if (!this.firstDiscoverReceived){
                this.mem_pool.push(new BlockchainTransaction(this.node,[new Message(this.node,null,"TRANSFER INITIAL 1000")]))
                const new_block = this.createBlock();
                this.broadcastMessage(new Message(this.node,null,new_block));
                this.firstDiscoverReceived = true
            }
            this.higher_protocol.handleMessageReceive(received_message)
        }

        this.initializeBlockchain = ()=>{
            this.broadcastMessage(new Message(this.node,null,"discover"))
        }

        disp(`[${this.node.name}] I'm a genesis node!`,BLOCK_VERBOSE)
    }

}