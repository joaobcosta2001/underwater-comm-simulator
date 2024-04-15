class BlockchainProtocol extends Protocol{

    constructor(node){
        super(node,"security",1,null,null);
        this.message_buffer = new MessageBuffer(800) //1000 bytes
        this.mem_pool = []
        this.blockchain = new LocalBlockchain(node,null)
        this.block_to_propose = null;

    

        

        this.addTransaction = (transaction)=>{
            if (this.transactionList.indexOf(transaction) == -1){
                this.transactionList.push(transaction)
            }
        }

        this.createBlock = ()=>{
            const proposer = this.chooseNextProposer();
            const transactions = this.chooseTransactions();
            this.blockchain.id += 1;
            const orderNumber = this.blockchain.id;
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

        this.getBlockchainStatusUpdate = ()=>{
            this.broadcastMessage(new Message(this.node,null,{
                type:"BCStatusUpdate",
                payload:{
                    unknownBlockIDs:this.blockchain.getUnkownBlockIds(),
                    lastKnownBlock:this.blockchain.getLastKnownBlockID(),
                    knownTransactions:this.mem_pool
                }
            }))

            
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

        this.handleBlockchainStatusUpdateReceive = (received_message)=>{
            for (const transaction of received_message.content.payload.knownTransactions){
                this.addTransaction(transaction)
            }
            let transactions_to_send = []
            for (const transaction of this.mem_pool){
                if (received_message.content.payload.knownTransactions.indexOf(transaction) == -1){
                    transactions_to_send.push(transaction)
                }
            }
            let blocks_to_send = []
            for (const block_id of received_message.content.payload.unknownBlockIDs){
                const block = this.blockchain.findBlock(block_id)
                if (block != null){
                    blocks_to_send.push(block)
                }
            }
            this.sendMessage(new Message(this.node,received_message.sender,{
                type:"BCStatusUpdateReply",
                payload:{
                    blocks:blocks_to_send,
                    transactions:transactions_to_send
                }
            }))

        }

        this.handleBlockchainStatusUpdateReplyReceive = (received_message)=>{
            for (const transaction of received_message.content.payload.transactions){
                this.addTransaction(transaction)
            }
            for (const block of received_message.content.payload.blocks){
                this.blockchain.addBlock(block)
            }
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
            }else if(received_message.content.type != undefined){
                if (received_message.content.type === "BCStatusUpdate"){
                    this.handleBlockchainStatusUpdateReceive(received_message)
                }else if (received_message.content.type === "BCStatusUpdateReply"){
                    this.handleBlockchainStatusUpdateReplyReceive(received_message)
                }else{
                    this.higher_protocol.handleMessageReceive(received_message)
                    console.warn(`[${this.node.name}] WARNING security layer received a message that does not contain a transaction nor a block`)
                }
            }else{
                console.warn("WARNING security layer received a message that does not contain valid content")
                this.higher_protocol.handleMessageReceive(received_message)
            }
        }

        this.initializeBlockchain = ()=>{
            console.error("A non genesis node was asked to initialize the blockchain!")
        }



        
        setInterval(() => {
            this.getBlockchainStatusUpdate()
        }, BROADCAST_PULL_PERIOD);
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


//TODO  add fees

class ProofOfStakeProtocol extends BlockchainProtocol{

    constructor(node){
        super(node);
        this.block_to_propose = null;

        this.createBlock = ()=>{
            const proposer = this.chooseNextProposer();
            const transactions = this.chooseTransactions();
            this.blockchain.id += 1;
            const orderNumber = this.blockchain.id;
            disp(`[${this.node.name}] Proposing new block (nextProposer=${proposer.name}|orderNumber=${orderNumber})`,BLOCK_VERBOSE)
            let newBlock = new BlockchainBlock(transactions,this.node,proposer,orderNumber)
            this.node.simulation.globalBlockchain.addBlock(newBlock)
            this.node.simulation.ui.updateBlockchainState()
            return newBlock
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