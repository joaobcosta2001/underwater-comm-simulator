class MessageBuffer{
    constructor(bitLimit){
        this.bitLimit = bitLimit
        this.messages = []
        this.length = 0
    }

    flush(){
        let mess_buf = this.messages
        this.messages = []
        this.length = 0
        return mess_buf
    }

    push(message){
        this.messages.push(message)
        this.length += message.length
    }

    isFull(){
        //console.log(`Size: ${this.size-this.avg_message_size} Current Occupancy: ${this.current_occupancy}`)
        return this.length >= this.bitLimit
    }
}


class BlockchainTransaction{
    constructor(sendingNode,messageList,id,invalid_flag){
        this.sendingNode = sendingNode
        this.messageList = messageList
        this.id = id
        this.invalid_flag = invalid_flag || false;
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
    constructor(transactions,proposer,nextProposerBuffer,id,invalid_flag){
        this.transactions = transactions
        this.proposer = proposer
        this.nextProposerBuffer = nextProposerBuffer
        this.nextProposerBufferIndex = 0
        this.id = id
        this.invalid_flag = invalid_flag || false;
    }
}

class LocalBlockchain{
    constructor(node,genesisNode){
        this.node = node
        this.blocks = []
        this.length = 0
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

    isTransactionInBlocks(transaction){
        for (const block of this.blocks){
            for (const t of block.transactions){
                if (t == transaction){
                    return true;
                }
            }
        }
        return false;
    }

    getTopBlock(){
        return this.blocks[this.blocks.length-1]
    }
}

class LocalProofOfStakeBlockchain extends LocalBlockchain{
    constructor(node,genesisNode){
        super(node,genesisNode)
        this.currentBalances = {}
        //this.currentBalances is only updated when a new block is added, therefore it might not be up to date, which will result in the node proposing
        //transactions, even if it no longer has the balance to do so. currentAvailableBalance allows the user to know how much it can still spend, by
        //keeping track of how much the user has spent (updated in every created transaction) and how much it has received (updated in every block)
        this.currentAvailableBalance = 0 
    }

    slashNode(node){
        console.log(`[${this.node.name}] Slashing node ${node.name}`)
        this.currentBalances[node.id] *= INVALID_BLOCK_SLASH_RATIO
    }

    
    updateCurrentBalances(block){
        let proposerReward = 0
        for (const transaction of block.transactions){
            if(this.currentBalances[transaction.sendingNode.id] == undefined){
                this.currentBalances[transaction.sendingNode.id] = 0
            }             
            if(this.currentBalances[block.proposer.id] == undefined){
                this.currentBalances[block.proposer.id] = 0
            }
            if (transaction instanceof ProofOfStakeTransferTransaction){
                if(this.currentBalances[transaction.receivingNode.id] == undefined){
                    this.currentBalances[transaction.receivingNode.id] = 0
                }
                this.currentBalances[transaction.sendingNode.id] -= transaction.amount + transaction.fee
                this.currentBalances[transaction.receivingNode.id] += transaction.amount
                if (transaction.receivingNode == this.node){
                    this.currentAvailableBalance += transaction.amount
                }
                proposerReward += transaction.fee
                //console.log(`[${this.node.name}] Adding ${transaction.amount} to node ${transaction.receivingNode.name} (current balance: ${this.currentBalances[transaction.receivingNode.id]})`)
            }
            if (transaction instanceof ProofOfStakeTransaction){
                //console.log(`[${this.node.name}] Adding transaction ${transaction.id} from node ${transaction.sendingNode.id} with fee ${transaction.fee})`)
                this.currentBalances[transaction.sendingNode.id] -= transaction.fee
                proposerReward += transaction.fee
            }
        }
        proposerReward += VALID_BLOCK_PROPOSAL_REWARD
        if (proposerReward > MINIMUM_TRANSACTIONS_IN_BLOCK*MAXIMUM_TRANSACTION_FEE){
            proposerReward = MINIMUM_TRANSACTIONS_IN_BLOCK*MAXIMUM_TRANSACTION_FEE
        }
        this.currentBalances[block.proposer.id] += proposerReward
    }

    lastUpdateBlockID = null

    addBlock(block){
        super.addBlock(block)
        if (this.lastUpdateBlockID == block.id){
            return
        }
        this.updateCurrentBalances(block)
        this.lastUpdateBlockID = block.id
    }


    
    getNodeBalance(node){
        return this.currentBalances[node.id]
    }

}


