
//This class is made assuming a specific HTML structure, it is not meant to be used in other projects without modifications


class UI{

    //TODO Resize tabs
    //TODO Add fullscreen buttons


    constructor(){
        this.simulation = null;

        this.selectedNode = null;

        //----TOOL BAR------
        //SPEED BUTTON
        this.speedButtonImage = document.getElementById("speed-button-img")
        this.speedButton = document.getElementById("speed-button")
        this.speedButton.addEventListener("click",()=>{
            if(simulation == null){
                return;
            }
            if(this.simulation.speed == 1){
                this.simulation.speed = 2
                this.speedButtonImage.src = "./images/speedx2.svg";
            }else if(this.simulation.speed == 2){
                this.simulation.speed = 4
                this.speedButtonImage.src = "./images/speedx4.svg"
            }else if(this.simulation.speed == 4){
                this.simulation.speed = 16
                this.speedButtonImage.src = "./images/speedx16.svg"
            }else if(this.simulation.speed == 16){
                this.simulation.speed = 64
                this.speedButtonImage.src = "./images/speedx64.svg"
            }else if(this.simulation.speed == 64){
                this.simulation.speed = 1
                this.speedButtonImage.src = "./images/speedx1.svg"
            }
        })

        this.playButton = document.getElementById("play-button")
        this.playButton.addEventListener("click",()=>{
            if(simulation == null){
                return;
            }
            if (this.simulation.state == "paused"){
                this.simulation.play()
            }
        });
        this.pauseButton = document.getElementById("stop-button");
        this.pauseButton.addEventListener("click",()=>{
            if(simulation == null){
                return;
            }
            if (this.simulation.state == "playing"){
                this.simulation.pause()
            }
        });

        this.restartButton = document.getElementById("restart-button")
        this.restartButton.addEventListener("click",()=>{
            if(simulation == null){
                return;
            }
            location.reload()
        })


        //Blockchain State
        this.openBlocksList = []
    }


    loadSimulation(simulation){
        this.simulation = simulation;
        simulation.ui = this;



        //NODE LIST
        this.NODE_LIST_UPDATE_PERIOD = 100;
        this.nodeListContent = document.getElementById("node-list-content")
        this.nodeDetailsContent = document.getElementById("node-details-content")
        this.selectedNodeDiv = null;
        this.nodeDetailsCurrentIntervalID = null;

        this.clearNodeDetailsContent = ()=>{
            if (this.nodeDetailsCurrentIntervalID != null){
                clearInterval(this.nodeDetailsCurrentIntervalID);
                this.nodeDetailsCurrentIntervalID = null;
            }
            this.selectedNodeDiv = null;
            this.selectedNode = null
            this.nodeDetailsContent.innerHTML = "Select a node to inspect"
            this.nodeDetailsContent.className = "node-details-content-empty"
        }

        this.parseNodeDetails = (node)=>{
            let nodeDetails = ""
            for (const property of node.propertiesToDisplay){
                let field = ""
                let fieldName = ""
                if (typeof property === "string"){
                    fieldName = `${property.charAt(0).toUpperCase() + property.slice(1)}`
                    field = node[property]
                }else if(Array.isArray(property)){
                    field = node[property[0]]
                    fieldName = property[0].charAt(0).toUpperCase() + property[0].slice(1)
                    for (const subproperty of property.slice(1)){
                        field = field[subproperty]
                        if (typeof field.subproperty ==="number"){
                            fieldName += `[${subproperty}]`
                        }else{
                            fieldName += `.${subproperty}`
                        }
                        if (field === undefined){
                            console.error("Properties to show of a node are not well configured! Found an undefined")
                            break;
                        }
                    }
                }
                if (typeof field === "string" || typeof field === "number" || typeof field === "boolean"){
                    nodeDetails += `${fieldName}: ${field}<br/>`
                }
                else if (field instanceof Vec3){
                    if (field.type === "angle"){
                        console.log(`Field ${fieldName} is an angle`)
                        field = field.toDegrees()
                        nodeDetails += `${fieldName}: ${field.x.toFixed(3)}º, ${field.y.toFixed(3)}º, ${field.z.toFixed(3)}º<br/>`
                    }else{
                        nodeDetails += `${fieldName}: ${field.x.toFixed(3)}, ${field.y.toFixed(3)}, ${field.z.toFixed(3)}<br/>`
                    }
                }else{
                    console.error(`Property type found which parser doesnt know how to process (${typeof field})` )
                }
            }
            return nodeDetails
        }

        this.showNodeDetails = (node)=>{
            this.selectedNode = node;
            this.nodeDetailsContent.innerHTML = this.parseNodeDetails(node)
            clearInterval(this.nodeDetailsCurrentIntervalID);
            this.nodeDetailsCurrentIntervalID = setInterval(()=>{
                this.nodeDetailsContent.innerHTML = this.parseNodeDetails(node)
            },this.NODE_LIST_UPDATE_PERIOD);
            this.nodeDetailsContent.className = "node-details-content-display"
        }

        for (const node of this.simulation.nodeList){
            let nodeDiv = document.createElement("div")
            nodeDiv.className = "node-list-element-div"
            let nodeImg = document.createElement("img")
            nodeImg.src = "./images/node.svg"
            nodeImg.className = "node-list-element-img"
            let nodeName = document.createElement("div")
            nodeName.className = "node-list-element-name"
            nodeName.innerHTML = node.name
            nodeDiv.appendChild(nodeImg)
            nodeDiv.appendChild(nodeName)
            nodeDiv.addEventListener("click",()=>{
                if (nodeDiv.classList.contains("node-list-element-div-selected")){
                    nodeDiv.classList.remove("node-list-element-div-selected")
                    this.clearNodeDetailsContent()
                }else{     
                    if ( this.selectedNodeDiv != null){
                        this.selectedNodeDiv.classList.remove("node-list-element-div-selected");
                    }
                    nodeDiv.classList.add("node-list-element-div-selected")
                    this.selectedNodeDiv = nodeDiv;
                    this.showNodeDetails(node);
                }
            })
            this.nodeListContent.appendChild(nodeDiv)
        }


    
        //LEFT TAB
        this.LEFT_TAB_UPDATE_PERIOD = 100;

        //METRICS

        this.metricsOpen = true
        this.metricsContent = document.getElementById("metrics-content")
        this.metricsButton = document.getElementById("metrics-title");
        this.metricsClosedIndicator = document.getElementById("metrics-closed-indicator");
        this.metricsButton.addEventListener("click",()=>{
            if(this.metricsOpen){
                this.metricsContent.style.display = "none"
                this.metricsClosedIndicator.style.display = "block"
            }else{
                this.metricsContent.style.display = "flex"
                this.metricsClosedIndicator.style.display = "none"
            }
            this.metricsOpen = !this.metricsOpen
        })

        //BLOCKCHAIN STATE 

        this.bcStateOpen = true
        this.bcStateContent = document.getElementById("bc-state-content")
        this.bcStateButton = document.getElementById("bc-state-title");
        this.bcStateClosedIndicator = document.getElementById("bc-state-closed-indicator");
        this.bcStateButton.addEventListener("click",()=>{
            if(this.bcStateOpen){
                this.bcStateContent.style.display = "none"
                this.bcStateClosedIndicator.style.display = "block"
            }else{
                this.bcStateContent.style.display = "flex"
                this.bcStateClosedIndicator.style.display = "none"
            }
            this.bcStateOpen = !this.bcStateOpen
        })

        this.updateLeftTabIntervalID = setInterval(()=>{
            //Update metrics
            this.metricsContent.innerHTML = `Simulation Time: ${(this.simulation.getElapsedTime()/1000).toFixed(3)}s<br/>Node Count: ${this.simulation.nodeList.length}<br/>`
        },this.LEFT_TAB_UPDATE_PERIOD)

        this.updateBlockchainState()
    }

    updateBlockchainState(){
        if (this.bcStateContent == null){
            return
        }
        this.bcStateContent.innerHTML = ""
        for (const block of this.simulation.globalBlockchain.blocks){
            let blockDiv = document.createElement("div")
            blockDiv.className = "bc-state-block-div"
            let blockTitle = document.createElement("div")
            blockTitle.className = "bc-state-block-title"
            blockTitle.innerHTML = `Block ${block.id}`
            let blockInfo = document.createElement("div")
            blockInfo.className = "bc-state-block-info"
            blockInfo.innerHTML = `Transactions: ${block.transactions.length}<br/>Proposer: ${block.proposer == null?"GENESIS":block.proposer.name}<br/>Next Proposer: ${block.nextProposer.name}`
            if (!this.openBlocksList.includes(block)){
                blockInfo.style.display = "none"
            }
            blockTitle.addEventListener("click",()=>{
                if (blockInfo.style.display == "none"){
                    blockInfo.style.display = "block"
                    this.openBlocksList.push(block)
                }else{
                    blockInfo.style.display = "none"
                    this.openBlocksList.pop(block)
                }
            })
            blockDiv.appendChild(blockTitle)
            blockDiv.appendChild(blockInfo)
            this.bcStateContent.appendChild(blockDiv)
        }
    }
}


