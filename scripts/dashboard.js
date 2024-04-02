


class NodeInfoDiv{
    constructor(node,parentDiv){
        this.node = node
        let nodeDiv = document.createElement("div")
        nodeDiv.className = "node-info-div"
        parentDiv.appendChild(nodeDiv)
        this.nodeNameDiv = document.createElement("div")
        this.nodeNameDiv.className = "node-name-text"
        this.messageNumberDiv = document.createElement("div")
        this.transactionNumberDiv = document.createElement("div")
        this.blockNumberDiv = document.createElement("div")
        nodeDiv.appendChild(this.nodeNameDiv)
        nodeDiv.appendChild(this.messageNumberDiv)
        nodeDiv.appendChild(this.transactionNumberDiv)
        nodeDiv.appendChild(this.blockNumberDiv)
        let blockchainToggleButton = document.createElement("div")
        blockchainToggleButton.className = "blockchain-toggle-button toggle-button-closed"
        this.blockchainDiv = document.createElement("div")
        this.blockchainDiv.style.display = "none"
        this.blockchainDivOpen = false
        blockchainToggleButton.addEventListener("click", ()=>{
            if (!this.blockchainDivOpen){
                this.blockchainDiv.style.display = "block"
                blockchainToggleButton.classList = "blockchain-toggle-button toggle-button-open"
            }else{
                this.blockchainDiv.style.display = "none"
                blockchainToggleButton.classList = "blockchain-toggle-button toggle-button-closed"
            }
            this.blockchainDivOpen = !this.blockchainDivOpen
        })
        nodeDiv.appendChild(blockchainToggleButton)
        nodeDiv.appendChild(this.blockchainDiv)
        for (const block of node.protocolList[1].blockchain.blocks){
            let blockDiv = document.createElement("div")
            blockDiv.innerHTML=`Transactions: ${block.transactions.length}<br/>`
            blockDiv.innerHTML=`Next Proposer: ${block.nextProposer.name}`
            this.blockchainDiv.appendChild(blockDiv)
        }

        //DAR UPDATE NA INTERFACE DE ESTADO DA BLOCKCHIN
    }

    update(){
        const messageNumber = this.node.protocolList[1].message_buffer.length
        const transactionNumber = this.node.protocolList[1].mem_pool.length
        const blockchain = this.node.protocolList[1].blockchain
        const blockNumber = blockchain.length
        this.nodeNameDiv.innerHTML = `${this.node.name}`
        this.messageNumberDiv.innerHTML = `Message Number: ${messageNumber}`
        this.transactionNumberDiv.innerHTML = `Transaction Number: ${transactionNumber}`
        this.blockNumberDiv.innerHTML = `Block Number: ${blockNumber}`
        this.blockchainDiv.innerHTML = ""
        for (const block of this.node.protocolList[1].blockchain.blocks){
            let blockDiv = document.createElement("div")
            blockDiv.className = "blockchain-block-div"
            blockDiv.innerHTML=`Order Number: ${block.order_number}<br/>Transactions: ${block.transactions.length}<br/>Next Proposer: ${block.nextProposer.name}`
            this.blockchainDiv.appendChild(blockDiv)
        }
    }
}




class Dashboard{
    constructor(simulation){
        this.simulation = simulation
        if (this.simulation.nodeList == null || this.simulation.nodeList.length == 0){
            console.error("ERROR Dashboard must be initialized after node initialization!")
            return
        }

        //Setup dashboard basics
        this.nodesDashboardOpen = false
        this.nodeDashboardNodesDiv = document.getElementById("node-dashboard-nodes-div")
        this.nodeDashboardToggleButton = document.getElementById("node-dashboard-toggle-button")
        this.nodeDashboardToggleButton.addEventListener("click",()=>{
            if(!this.nodesDashboardOpen){
                this.nodeDashboardNodesDiv.style.display = "block";
                this.nodeDashboardNodesDiv.style.height = "calc(100vh - 75px)"
                this.nodeDashboardToggleButton.classList = ["toggle-button-open"]
            }else{
                this.nodeDashboardNodesDiv.style.display = "none";
                this.nodeDashboardNodesDiv.style.height = "auto"
                this.nodeDashboardToggleButton.classList = ["toggle-button-closed"]
            }
            this.nodesDashboardOpen = !this.nodesDashboardOpen;
        })

        //Generate Node Info Divs

        this.nodeInfoDivs = []

        for (const node of this.simulation.nodeList){
            this.nodeInfoDivs.push(new NodeInfoDiv(node,this.nodeDashboardNodesDiv))
        }

    }

    beginUpdates(){
        this.update()
    }

    update(){
        for (const nodeInfoDiv of this.nodeInfoDivs){
            nodeInfoDiv.update()
        }
        setTimeout(()=>{this.update()},DASHBOARD_UPDATE_PERIOD)
    }
}