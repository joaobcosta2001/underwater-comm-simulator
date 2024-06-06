class BlockchainProtocol extends Protocol{

    constructor(node){
        super(node,"security",1,null,null);
        this.message_buffer = new MessageBuffer(MESSAGE_BUFFER_SIZE) //1000 bytes
        this.mem_pool = []
        this.blockchain = new LocalBlockchain(node,null)
        this.previous_block_before_propose = null;

    

        

        this.addTransaction = (transaction)=>{
            //this.node.simulation.simulator.ui.addNodeEvent(this.node,`Transaction received from ${transaction.sendingNode.name} with id ${transaction.id}`)
            this.mem_pool.push(transaction)
        }


        this.addBlock = (block)=>{
            this.blockchain.addBlock(block)
        }

        this.createBlock = ()=>{
            const nextProposerBuffer = this.chooseNextProposerBuffer();
            const transactions = this.chooseTransactions();
            this.blockchain.id += 1;
            const orderNumber = this.blockchain.id;
            disp(`[${this.node.name}] Proposing new block (nextProposer=${proposer.name}|orderNumber=${orderNumber})`,BLOCK_VERBOSE)
            //this.node.simulation.simulator.ui.addNodeEvent(this.node,`Proposing new block (nextProposer=${proposer.name}|orderNumber=${orderNumber})`)
            return new BlockchainBlock(transactions,this.node,nextProposerBuffer,orderNumber)
        }

        this.chooseNextProposerBuffer = ()=>{
            return [this.node.getRandomKnownNode()]
        }

        this.chooseTransactions = ()=>{
            const mem_pool_copy = this.mem_pool
            this.mem_pool = []
            for (const transaction of mem_pool_copy){
                if (this.blockchain.isTransactionInBlocks(transaction)){
                    this.mem_pool.pop(transaction)
                }
            }
            return mem_pool_copy
        }

        this.getBlockchainStatusUpdate = ()=>{
            this.broadcastMessage(new Message(this.node,null,{
                type:"BCStatusUpdate",
                payload:{
                    unknownBlockIDs:this.blockchain.getUnkownBlockIds(),
                    lastKnownBlock:this.blockchain.getLastKnownBlockID(),
                    knownTransactions:this.mem_pool,
                    knownBlocks:this.blockchain.blocks
                }
            }))

            
        }


        this.isNextProposer = ()=>{
            if (this.blockchain.length == 0){
                return false
            }
            let topBlock = this.blockchain.blocks[this.blockchain.blocks.length-1]
            return topBlock.nextProposerBuffer[topBlock.nextProposerBufferIndex] == this.node
        }

        this.nextProposer = ()=>{
            if (this.blockchain.length == 0){
                return null
            }
            let topBlock = this.blockchain.blocks[this.blockchain.blocks.length-1]
            return topBlock.nextProposerBuffer[topBlock.nextProposerBufferIndex]
        }

        this.sendMessage = (message)=>{
            disp(`[${this.node.name}][BLOCKCHAIN] adding message "${message.content}" to message buffer`,BLOCKCHAIN_VERBOSE)
            this.message_buffer.push(message)
            if (this.message_buffer.isFull()){
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

            //this.node.simulation.simulator.ui.addNodeEvent(this.node,"Received StatusUpdateRequest")
            for (const transaction of received_message.content.payload.knownTransactions){
                if(this.handleTransactionReceive(transaction)){
                    //this.node.simulation.simulator.ui.addNodeEvent(this.node,"Found new transaction in StatusUpdateRequest")
                }
            }
            for (const block of received_message.content.payload.knownBlocks){
                if (this.blockchain.findBlock(block.id) == null){
                    this.blockchain.addBlock(block)
                    this.handleBlockReceive(block)
                }
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
                unknownTransactionCount += this.handleTransactionReceive(transaction)?1:0
            }
            for (const block of received_message.content.payload.blocks){
                this.blockchain.addBlock(block)
                this.handleBlockReceive(block)
                unknownBlockCount += 1
            }
            if(unknownBlockCount > 0){
                console.log(`${[this.node.name]} Received new block`)
            }
            //this.node.simulation.simulator.ui.addNodeEvent(this.node,`Received BCStatusUpdateReply from ${received_message.sender.name} with ${unknownTransactionCount} unknown transactions and ${unknownBlockCount} unknown blocks`)
        }

        this.handleTransactionReceive = (transaction)=>{
            if (this.mem_pool.indexOf(transaction) == -1){
                this.mem_pool.push(transaction)
            }
            disp(`[${this.node.name}][BLOCKCHAIN] transaction received from ${transaction.sendingNode.name}`,BLOCKCHAIN_VERBOSE)
        }

        this.handleBlockReceive = (block)=>{
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
            //this.node.simulation.simulator.ui.addNodeEvent(this.node,`Sending BCStatusUpdate to all nodes`)
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
                if (new_block != null){
                    this.addBlock(new_block)
                    this.broadcastMessage(new Message(this.node,null,new_block));
                }
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

    constructor(node, isMalicious){
        super(node);
        this.previous_block_before_propose = false; //dont remember the purpose of this but if removed it breaks
        this.blockchain = new LocalProofOfStakeBlockchain(node,null)
        this.previousProposers = {}
        this.isMalicious = isMalicious;

        this.createBlock = ()=>{
            const nextProposerBuffer = this.chooseNextProposerBuffer();
            if (nextProposerBuffer == null || nextProposerBuffer.length == 0){
                console.error("Genesis block doesnt known any node!")
            }
            const transactions = this.chooseTransactions();
            if (transactions == null){
                this.previous_block_before_propose = true
                return
            }
            this.blockchain.id += 1;
            const orderNumber = this.blockchain.id;
            disp(`[${this.node.name}] Proposing new block (nextProposer=${nextProposerBuffer}|orderNumber=${orderNumber})`,BLOCK_VERBOSE)
            
            //this.node.simulation.simulator.ui.addNodeEvent(this.node,`Proposing new block (nextProposer=${proposer.name}|orderNumber=${orderNumber})`)
            let newBlock = new BlockchainBlock(transactions,this.node,nextProposerBuffer,orderNumber)
            if (this.isMalicious){
                newBlock.invalid_flag = true
            }


            //Update UI global blockchain
            console.log("Adding block to blockchain")
            this.node.simulation.globalBlockchain.addBlock(newBlock)
            this.node.simulation.ui.updateBlockchainState()
            return newBlock
        }

        this.createdTransactionCount = 0
        this.createTransaction = ()=>{
            disp(`[${this.node.name}][BLOCKCHAIN] message buffer full, creating transaction`,BLOCKCHAIN_VERBOSE)
            //this.node.simulation.simulator.ui.addNodeEvent(this.node,`Creating new transaction with ${this.message_buffer.length} bits.`)
            let messages_for_transaction = this.message_buffer.flush()
            let fee = Math.random()*MAXIMUM_TRANSACTION_FEE
            let new_transaction = new ProofOfStakeTransaction(this.node,messages_for_transaction,`${this.node.id}-${this.createdTransactionCount}`,fee)
            if (this.isMalicious && Math.random < MALICIOUS_NODE_INVALID_TRANSACTION_RATE){
                new_transaction.invalid_flag = true
            }
            this.mem_pool.push(new_transaction)
            this.createdTransactionCount += 1
            this.lower_protocol.broadcastMessage(new Message(this.node, null,new_transaction))
        }

        this.validateBlock = (block)=>{
            if (block.invalid_flag){
                return false
            }
            let tempBalances = {};
            for (const transaction of block.transactions) {
                if (transaction.invalid_flag) {
                    return false;
                }
                // Initialize sender's balance if not already done
                if (!tempBalances.hasOwnProperty(transaction.sendingNode)) {
                    tempBalances[transaction.sendingNode] = this.blockchain.getNodeBalance(transaction.sendingNode);
                }
                // Check if the transaction fee is negative or sender does not have enough balance
                if ((transaction.fee < 0 || tempBalances[transaction.sendingNode] < transaction.fee) && transaction.sendingNode != "GENESIS") {
                    return false;
                }
                // Deduct the transaction fee from the sender's temporary balance
                tempBalances[transaction.sendingNode] -= transaction.fee;
            }
            return true;
        }

        this.chooseNextProposerBuffer = ()=>{

            //Proposers are chosen in a way that prioratizes nodes with large stake but tries to help poorer nodes to also be selected in order not to create a positive feedback loop
            console.log("Choosing next proposer")


            //If it is the genesis just set to self
            if(Object.keys(this.blockchain.currentBalances).length == 0){
                return [this.node]
            }

            let totalStake = 0
            let stakes = []
            let stakes_owner = []
            for (const node_id in this.blockchain.currentBalances){
                if (node_id == "undefined" || node_id == "GENESIS"){
                    continue
                }
                let currentStake = this.blockchain.currentBalances[node_id]
                if(this.previousProposers[node_id] == undefined){
                    this.previousProposers[node_id] = 0
                }
                let previous_proposals = this.previousProposers[node_id]
                if (previous_proposals > 0){
                    currentStake = Math.pow(currentStake,REPEATED_PROPOSER_PENALTY*previous_proposals)
                }
                totalStake += currentStake
                stakes.push(totalStake)
                stakes_owner.push(node_id)
            }
            //Choose buffer of next proposers
            let nextProposerBuffer = []
            for (let j = 0; j < 1 + BACKUP_PROPOSER_NUMBER; j++){
                let random = Math.random()*totalStake
                for (let i = 0; i< stakes.length; i++){
                    if (random > stakes[i]){
                        continue
                    }
                    let chosenNode = this.node.simulation.getNodeById(stakes_owner[i])
                    nextProposerBuffer.push(chosenNode)
                    if(chosenNode == null){
                        console.log("NULL NEXT PROPOSER")
                    }
                    //Unless there are not enough nodes, nodes are not to be repeated
                    if (stakes_owner.length >= 1 + BACKUP_PROPOSER_NUMBER){
                        totalStake -= stakes[i];  // Update the total stake
                        stakes.splice(i, 1);  // Remove the selected stake
                        stakes_owner.splice(i, 1);  // Remove the selected node
                    }
                    break;
                }
                nextProposerBuffer.push(this.node.simulation.getNodeById(stakes_owner[stakes_owner.length - 1]))
            }
            return nextProposerBuffer
        }

        this.chooseTransactions = ()=>{
            for (const transaction of this.mem_pool){
                if (this.blockchain.isTransactionInBlocks(transaction)){
                    this.mem_pool.pop(transaction)
                }
            }
            
            if(this.mem_pool.length < MINIMUM_TRANSACTIONS_IN_BLOCK && !this.node.isGenesis){
                return null
            }
            let mem_pool_copy = this.mem_pool
            this.mem_pool = []
            return mem_pool_copy
        }


        this.handleTransactionReceive = (transaction)=>{
            //Check if the transaction is valid
            if (transaction.invalid_flag){
                return false
            }
            //Check if it is already in the mempool
            if (this.mem_pool.indexOf(transaction) != -1){
                return false
            }
            //Check if it is already in the blockchain
            if (this.blockchain.isTransactionInBlocks(transaction)){
                return false
            }

            this.addTransaction(transaction)

            this.attemptBlockProposal()
            
            return true
        }

        this.handleBlockReceive = (block)=>{
            
            //IF received an invalid block
            if (!this.validateBlock(block)){
                console.log(`[${this.node.name}] Received invalid block from ${block.proposer.name}`)
                //Change to a backup proposer
                let topBlock = this.blockchain.getTopBlock()
                topBlock.nextProposerBufferIndex++
                if(topBlock.nextProposerBufferIndex >= topBlock.nextProposerBuffer.length && topBlock.nextProposerBuffer.length > 1){
                    topBlock.nextProposerBufferIndex = 0
                    alert("ALL BACKUP NODES PROPOSED INVALID BLOCKS!!! BLOCKCHAIN COMPROMISED")
                }
                this.blockchain.slashNode(block.proposer)
                return
            }

            //Remove transactions in block from mempool
            for (const transaction of block.transactions){
                const transaction_index = this.mem_pool.indexOf(transaction)
                if (transaction_index != -1){
                    this.mem_pool.splice(transaction_index,1)
                }
            }
            //console.log(`[${this.node.name}] Received block, adding it`)
            this.blockchain.addBlock(block)
            this.previousProposers[block.proposer.id] += 1
            this.node.simulation.simulator.ui.addNodeEvent(this.node,`${this.blockchain.getNodeBalance(this.node)}`)

            //TODO Report messages to application layer
            //this.node.simulation.ui.addNodeEvent(this.node,`Block received from ${block.proposer.name} with ${block.transactions.length} transactions. Next proposer is ${block.nextProposer.name} which is ${block.nextProposer != this.node?"not":""} me`)
            this.attemptBlockProposal()
        }

        this.attemptBlockProposal = ()=>{
            if (this.isNextProposer()){
                if(this.mem_pool.length >= MINIMUM_TRANSACTIONS_IN_BLOCK){
                    console.log("I have now enough transactions!(" + this.mem_pool.length +"/"+MINIMUM_TRANSACTIONS_IN_BLOCK+ ")")
                    this.proposeNewBlock()
                    return true
                }
            }
            return false
        }

        this.proposeNewBlock = ()=>{
            const new_block = this.createBlock();
            if (new_block != null){
                console.log("Created new block adding")
                this.addBlock(new_block)
                this.broadcastMessage(new Message(this.node,null,new_block));
            }
            return new_block
        }
    }
}

class ProofOfStakeProtocolGenesis extends ProofOfStakeProtocol{
    constructor(node, isMalicious = false) {
        super(node, isMalicious);
        this.firstDiscoverReceived = false;
        this.blockchain = new LocalProofOfStakeBlockchain(this.node, this.node);


        // Initialize the blockchain
        this.initializeBlockchain = () => {
            console.log(`[${this.node.name}] Initializing blockchain`);

            //Normally known nodes are added through a DISCOVER message but since this is a genesis node, we need to add them manually
            for (const node of this.node.simulation.nodeList) {
                if (node.channels[0].withinRange(this.node)) {
                    this.node.addKnownNode(node);
                }
            }

            for (const node of this.node.simulation.nodeList) {
                this.mem_pool.push(new ProofOfStakeTransferTransaction("GENESIS", node, STARTING_BALANCE, -Math.random() * 10000, 0));
            }
            const new_block = this.createBlock();
            if (new_block != null) {
                console.log(`[${this.node.name}] Creating first block`);
                this.addBlock(new_block);
                this.broadcastMessage(new Message(this.node, null, new_block));
            }
        };

        // Display a message indicating the node is a genesis node
        disp(`[${this.node.name}] I'm a genesis node!`, BLOCK_VERBOSE);
    }

}