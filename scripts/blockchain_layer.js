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
        this.length += 1
        this.total_message_count+=1;
        this.total_message_size += message.length
        this.avg_message_size = this.total_message_size/this.total_message_count
    }

    checkAlmostFull(){
        //console.log(`Size: ${this.size-this.avg_message_size} Current Occupancy: ${this.current_occupancy}`)
        return this.size-this.avg_message_size < this.current_occupancy
    }
}


class BlockchainTransaction{
    constructor(sendingNode,messageList,id){
        this.sendingNode = sendingNode
        this.messageList = messageList
        this.id = id
    }
}

class ProofOfStakeTransaction extends BlockchainTransaction{
    constructor(sendingNode,messageList,id,fee){
        super(sendingNode,messageList,id)
        this.fee = fee;
    }
}

class ProofOfStakeTransferTransaction extends ProofOfStakeTransaction{
    constructor(sendingNode,receivingNode,amount,id,fee){
        super(sendingNode,[],id,fee)
        this.receivingNode = receivingNode
        this.amount = amount
    }
}


class BlockchainBlock{
    constructor(transactions,proposer,nextProposer,id){
        this.transactions = transactions
        this.proposer = proposer
        this.nextProposer = nextProposer
        this.id = id
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
        this.id = 0
    }

    findBlock(id){
        for (const block of this.blocks){
            if (block.id == id){
                return block
            }
        }
        return null
    }


    addBlock(block){
        if(this.findBlock(block.id) != null){
            return
        }
        this.blocks.splice(block.id,0,block)
        this.id = this.blocks[this.blocks.length-1].id
        this.length = this.blocks.length
    }

    getUnkownBlockIds(){
        let unknownBlockIds = []
        for (let i = 0; i < this.length; i++){
            if (this.findBlock(i) == null){
                unknownBlockIds.push(i)
            }
        }
        return unknownBlockIds
    }

    getLastKnownBlockID(){
        if(this.blocks.length == 0){
            return -1
        }
        return this.blocks[this.blocks.length-1].id
    }
}

class LocalProofOfStakeBlockchain extends LocalBlockchain{
    constructor(node,genesisNode,balance){
        super(node,genesisNode)
        this.currentBalances = {}
        this.currentBalances[node] = balance
    }

    
    updateCurrentBalances(block){
        for (const transaction of block.transactions){
            if (transaction instanceof ProofOfStakeTransferTransaction){
                this.currentBalances[transaction.sendingNode] -= transaction.amount + transaction.fee
                this.currentBalances[transaction.receivingNode] += transaction.amount
            }
            if (transaction instanceof ProofOfStakeTransaction){
                if( this.node == transaction.sendingNode){
                }
                this.currentBalances[transaction.sendingNode] -= transaction.fee
                this.currentBalances[block.proposer] += transaction.fee
            }
        }
    }

    addBlock(block){
        super.addBlock(block)
        this.updateCurrentBalances(block)
    }

    
    getNodeBalance(nodeName){
        for (const node of Object.keys(this.currentBalances)){
            if (node.name == nodeName){
                return this.currentBalances[node]
            }
        }

        return null;
    }

}


