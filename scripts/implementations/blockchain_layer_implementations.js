class BlockchainProtocol extends Protocol{

    constructor(node){
        super(node,"security",1,null,null);
        this.message_buffer = new MessageBuffer(MESSAGE_BUFFER_SIZE) //1000 bytes
        this.mem_pool = []
        this.blockchain = new LocalBlockchain(node,null)
        this.block_to_propose = null;

    

        

        this.addTransaction = (transaction)=>{
            if (this.mem_pool.indexOf(transaction) == -1){
                this.mem_pool.push(transaction)
            }else{
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


        this.isNextProposer = ()=>{
            if (this.blockchain.length == 0){
                return false
            }
            return this.blockchain.blocks[this.blockchain.blocks.length-1].nextProposer == this.node
        }

        this.sendMessage = (message)=>{
            disp(`[${this.node.name}][BLOCKCHAIN] adding message "${message.content}" to message buffer`,BLOCKCHAIN_VERBOSE)
            this.message_buffer.push(message)
            if (this.message_buffer.checkAlmostFull()){
                console.log("Buffer is almost full")
                this.createTransaction()
            }
        }

        //Sends a message that wont be retained in the message buffer and be part of a transaction
        this.sendExpressMessage = (message)=>{
            this.lower_protocol.sendMessage(message)
        }

        this.createTransaction = ()=>{
            disp(`[${this.node.name}][BLOCKCHAIN] message buffer full, creating transaction`,BLOCKCHAIN_VERBOSE)
            let messages_for_transaction = this.message_buffer.flush()
            let new_transaction = new BlockchainTransaction(this.node,messages_for_transaction)
            this.mem_pool.push(new_transaction)
            this.lower_protocol.broadcastMessage(new Message(this.node, null,new_transaction))

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
            for (const block of this.blockchain.blocks){
                if (block.id > received_message.content.payload.lastKnownBlock && blocks_to_send.indexOf(block) == -1){
                    blocks_to_send.push(block)
                }
            }
            this.sendExpressMessage(new Message(this.node,received_message.sender,{
                type:"BCStatusUpdateReply",
                payload:{
                    blocks:blocks_to_send,
                    transactions:transactions_to_send
                }
            }))

        }

        this.handleBlockchainStatusUpdateReplyReceive = (received_message)=>{
            let unknownTransactionCount = 0
            let unknownBlockCount = 0
            for (const transaction of received_message.content.payload.transactions){
                this.addTransaction(transaction)
                unknownTransactionCount += 1
            }
            for (const block of received_message.content.payload.blocks){
                this.blockchain.addBlock(block)
                this.handleBlockReceive(block)
                unknownBlockCount += 1
            }
            this.node.simulation.simulator.ui.addNodeEvent(this.node,`${unknownTransactionCount},${unknownBlockCount},${this.blockchain.length},${this.node.channels[0].getNodeDegree(this.node.simulation.nodeList)},${this.isNextProposer()}`)
        }

        this.handleTransactionReceive = (transaction)=>{
            if (this.mem_pool.indexOf(transaction) == -1){
                this.mem_pool.push(transaction)
            }
            disp(`[${this.node.name}][BLOCKCHAIN] transaction received from ${transaction.sendingNode.name}`,BLOCKCHAIN_VERBOSE)
        }

        this.handleBlockReceive = (block)=>{
            disp(`[${this.node.name}][BLOCKCHAIN] block received from ${block.proposer.name} (nextProposer=${block.nextProposer.name})`.BLOCKCHAIN_VERBOSE || BLOCK_VERBOSE)
            for (const transaction of block.transactions){
                while(transaction.messageList.length > 0){
                    const message = transaction.messageList.pop()
                }
            }
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
        }, BROADCAST_PULL_PERIOD/TIME_MULTIPLIER);
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

    constructor(node, balance){
        super(node);
        this.block_to_propose = null;
        this.blockchain = new LocalProofOfStakeBlockchain(node,null,balance)

        this.createBlock = ()=>{
            const proposer = this.chooseNextProposer();
            if (proposer == null){
                console.error("Genesis block doesnt known any node!")
            }
            const transactions = this.chooseTransactions();
            this.blockchain.id += 1;
            const orderNumber = this.blockchain.id;
            disp(`[${this.node.name}] Proposing new block (nextProposer=${proposer.name}|orderNumber=${orderNumber})`,BLOCK_VERBOSE)
            let newBlock = new BlockchainBlock(transactions,this.node,proposer,orderNumber)

            //Update UI global blockchain
            this.node.simulation.globalBlockchain.addBlock(newBlock)
            this.node.simulation.ui.updateBlockchainState()
            return newBlock
        }

        this.createTransaction = ()=>{
            disp(`[${this.node.name}][BLOCKCHAIN] message buffer full, creating transaction`,BLOCKCHAIN_VERBOSE)
            let messages_for_transaction = this.message_buffer.flush()
            let new_transaction = new ProofOfStakeTransaction(this.node,messages_for_transaction,Date.now(),Math.random()*10)
            this.mem_pool.push(new_transaction)
            this.lower_protocol.broadcastMessage(new Message(this.node, null,new_transaction))
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
    constructor(node,balance){
        super(node)
        this.firstDiscoverReceived = false
        this.blockchain = new LocalProofOfStakeBlockchain(this.node,this.node,balance)

        this.handleDiscoverReceive = (received_message)=>{
            if (!this.firstDiscoverReceived){
                this.mem_pool.push(new BlockchainTransaction(this.node,[new Message(this.node,null,"TRANSFER INITIAL 1000")]))
                const new_block = this.createBlock();
                console.log(`[${this.node.name}] Genesis node proposing block with proposer ${new_block.proposer.name} and next proposer ${new_block.nextProposer.name}`)
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