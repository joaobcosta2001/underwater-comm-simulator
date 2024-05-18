
//This class is made assuming a specific HTML structure, it is not meant to be used in other projects without modifications


class UI{

    //TODO Resize tabs
    //TODO Add fullscreen buttons


    constructor(simulator){

        this.simulator = simulator;

        this.selectedNode = null;

        //----TOOL BAR------
        //SPEED BUTTON
        this.speedButtonImage = document.getElementById("speed-button-img")
        this.speedButton = document.getElementById("speed-button")
        this.speedButton.addEventListener("click",()=>{
            if(this.simulator.simulation == null){
                return;
            }
            if(TIME_MULTIPLIER == 1){
                TIME_MULTIPLIER = 2
                this.speedButtonImage.src = "./images/speedx2.svg";
            }else if(TIME_MULTIPLIER == 2){
                TIME_MULTIPLIER = 4
                this.speedButtonImage.src = "./images/speedx4.svg"
            }else if(TIME_MULTIPLIER == 4){
                TIME_MULTIPLIER = 16
                this.speedButtonImage.src = "./images/speedx16.svg"
            }else if(TIME_MULTIPLIER == 16){
                TIME_MULTIPLIER = 64
                this.speedButtonImage.src = "./images/speedx64.svg"
            }else if(TIME_MULTIPLIER == 64){
                TIME_MULTIPLIER = 1
                this.speedButtonImage.src = "./images/speedx1.svg"
            }
        })

        this.playButton = document.getElementById("play-button")
        this.playButton.addEventListener("click",()=>{
            if(this.simulator.simulation == null){
                return;
            }
            if (this.simulator.simulation.state == "paused"){
                this.simulator.simulation.play()
            }
        });
        this.pauseButton = document.getElementById("stop-button");
        this.pauseButton.addEventListener("click",()=>{
            if(this.simulator.simulation == null){
                return;
            }
            if (this.simulator.simulation.state == "playing"){
                this.simulator.simulation.pause()
            }
        });

        this.restartButton = document.getElementById("restart-button")
        this.restartButton.addEventListener("click",()=>{
            if(this.simulator.simulation == null){
                return;
            }
            location.reload()
        })

        this.allEventsList = []
        this.downloadButton = document.getElementById("download-button")
        this.downloadButton.addEventListener("click",()=>{
            let csvFileContent = "Timestamp,Node,Description\n"
            for (const event of this.allEventsList){
                if (event.node == null){
                    csvFileContent += `${((event.timestamp-this.simulator.simulation.startTime)/1000).toFixed(4)},,${event.description}\n`
                }else{
                    csvFileContent += `${((event.timestamp-this.simulator.simulation.startTime)/1000).toFixed(4)},${event.node.name},${event.description}\n`
                }
            }
            let blob = new Blob([csvFileContent], { type: 'text/csv;charset=utf-8;' });
            let url = URL.createObjectURL(blob);
            let link = document.createElement('a');
            link.setAttribute('href', url);
            const currentDate = new Date()
            link.setAttribute('download', `report-${currentDate.getFullYear()}-${currentDate.getMonth()+1}-${currentDate.getDate()}-${currentDate.getHours()}-${currentDate.getMinutes()}-${currentDate.getSeconds()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })



        //Blockchain State
        this.openBlocksList = []



        //Simulation Selection
        this.simulationControlOpen = true
        this.simulationControlContent = document.getElementById("simulation-control-content")
        this.simulationControlButton = document.getElementById("simulation-control-title");
        this.simulationControlClosedIndicator = document.getElementById("simulation-control-closed-indicator");
        this.simulationControlButton.addEventListener("click",()=>{
            if(this.simulationControlOpen){
                this.simulationControlContent.style.display = "none"
                this.simulationControlClosedIndicator.style.display = "block"
            }else{
                this.simulationControlContent.style.display = "block"
                this.simulationControlClosedIndicator.style.display = "none"
            }
            this.simulationControlOpen = !this.simulationControlOpen
        })
        this.simulationOptions = ["Mesh", "Mule","Pipeline"]
        this.simulationSelector = document.getElementById("simulation-type-select")
        this.simulationOptions.forEach((option)=>{
            let optionElement = document.createElement("option")
            optionElement.value = option
            optionElement.innerHTML = option
            this.simulationSelector.appendChild(optionElement)
        })

        this.nodeNumberInput = document.getElementById("simulation-node-amount")
        this.reloadSimulationButton = document.getElementById("reload-simulation-button")
        this.reloadSimulationButton.addEventListener("click",()=>{
            let nodeAmount = parseInt(this.nodeNumberInput.value)
            let simulationType = this.simulationSelector.value
            if (simulationType == "Mesh"){
                this.simulator.simulation = new MeshSimulation(this.simulator,nodeAmount,0.9)
            }else if (simulationType == "Mule"){
                this.simulator.simulation = new MuleSimulation(this.simulator,nodeAmount,0.5)
            }else if (simulationType == "Pipeline"){
                this.simulator.simulation = new PipelineSimulation(this.simulator,nodeAmount,0.5)
            }
            this.loadSimulation(this.simulator.simulation)
        })


        this.physicalDistanceText = document.getElementById("physical-distance-multiplier-text")
        this.physicalDistanceSlider = document.getElementById("physical-distance-multiplier-slider")
        this.physicalDistanceSlider.oninput = ()=> {
            PHYSICAL_DISTANCE_MULTIPLIER = Math.pow(10,this.physicalDistanceSlider.value)
            this.physicalDistanceText.innerHTML = `Physical Distance Multiplier: 10^${this.physicalDistanceSlider.value}`
        }


        this.fogDensityText = document.getElementById("shader-fog-text")
        this.fogDensitySlider = document.getElementById("shader-fog-slider")
        this.fogDensitySlider.oninput = ()=> {
            let density = this.fogDensitySlider.value
            this.simulator.assets["oceanShader"].setUniform('fogDensity', 50000/Math.log(density+1))
            this.fogDensityText.innerHTML = `Fog Density: ${density}%`
        }

        

    }


    loadSimulation(simulation){
        this.simulator.simulation = simulation;
        this.simulation = simulation;
        simulation.ui = this;



        //NODE LIST
        this.NODE_LIST_UPDATE_PERIOD = 100;
        this.nodeListContent = document.getElementById("node-list-content")
        this.nodeDetailsContent = document.getElementById("node-details-content")
        this.nodeDetailsEvents = document.getElementById("node-details-events")
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
            this.nodeDetailsEvents.style.display = "none"
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
                        if(field === undefined){
                            console.error("Properties to show of a node are not well configured! Found an undefined")
                            break;
                        }
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
                    continue
                }
            }
            return nodeDetails
        }

        this.showNodeDetails = (node)=>{
            this.selectedNode = node;
            this.nodeDetailsEvents.style.display = "flex"
            this.updateNodeEvents()
            this.nodeDetailsContent.innerHTML = this.parseNodeDetails(node)
            clearInterval(this.nodeDetailsCurrentIntervalID);
            this.nodeDetailsCurrentIntervalID = setInterval(()=>{
                this.nodeDetailsContent.innerHTML = this.parseNodeDetails(node)
            },this.NODE_LIST_UPDATE_PERIOD);
            this.nodeDetailsContent.className = "node-details-content-display"
        }


        this.updateNodeEvents = ()=>{
            if(this.selectedNode != null){
                let eventText = ""
                for (const event of this.selectedNode.events){
                    eventText += `[${((event.timestamp - this.simulator.simulation.startTime)/1000).toFixed(3)}s] ${event.description}<br/>`
                }
                this.nodeDetailsEvents.innerHTML = eventText
            }
        }

        for (const node of this.simulator.simulation.nodeList){
            let nodeDiv = document.createElement("div")
            nodeDiv.className = "node-list-element-div"
            let nodeImg = document.createElement("img")
            nodeImg.src = "./images/node.svg"
            nodeImg.className = "node-list-element-img"
            let nodeName = document.createElement("div")
            nodeName.className = "node-list-element-name"
            nodeName.innerHTML = `${node.name}${node.isGenesis?"<br/>[Genesis]":""}`
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

        this.totalNodeDegree = 0
        this.nodeDegreeSamples = 0

        this.updateLeftTabIntervalID = setInterval(()=>{
            //Update metrics
            let upToDateNodes = 0
            let totalAwareness = 0
            for (const node of this.simulator.simulation.nodeList){
                if (node.protocolList[1].blockchain.blocks.length == this.simulator.simulation.globalBlockchain.blocks.length-1){
                    upToDateNodes += 1;
                }
                totalAwareness += node.protocolList[1].blockchain.blocks.length/(this.simulator.simulation.globalBlockchain.blocks.length-1)
            }
            let averageTimeToAddMessageToBlockchain = "";
            if(this.simulation.messagesAddedToBlockchain == 0){
                averageTimeToAddMessageToBlockchain = "Unknown"
            }else{
                averageTimeToAddMessageToBlockchain = (this.simulation.messagesAddedToBlockchainTotalTime/this.simulation.messagesAddedToBlockchain/1000).toFixed(3) + "s"
            }

            for(const node1 of this.simulator.simulation.nodeList){
                for (const node2 of this.simulator.simulation.nodeList){
                    if (node1 != node2){
                        if(node1.channels[0].withinRange(node2)){
                            this.totalNodeDegree += 1
                        }
                    }
                }
                this.nodeDegreeSamples += 1
            }

            this.addNodeEvent(null,`${this.simulator.simulation.messagesAddedToBlockchain == 0?"0":(this.simulator.simulation.messagesAddedToBlockchain/(Date.now()-this.simulator.simulation.startTime)*1000).toFixed(3)}`)

            this.metricsContent.innerHTML =
                `FrameRate: ${this.simulator.fps !== null?this.simulator.fps:"?"}fps<br/>
                Simulation Time: ${(this.simulator.simulation.getElapsedTime()/1000).toFixed(3)}s<br/>
                Node Count: ${this.simulator.simulation.nodeList.length}<br/>
                Nodes Completely Aware: ${upToDateNodes}/${this.simulator.simulation.nodeList.length}<br/>
                Average Node Awareness: ${(totalAwareness/this.simulator.simulation.nodeList.length*100).toFixed(2)}%<br/>
                Average Time to Blockchain: ${averageTimeToAddMessageToBlockchain}<br/>
                Average Node Degree: ${(this.totalNodeDegree/this.nodeDegreeSamples).toFixed(3)}<br/>
                Message Throughput: ${this.simulator.simulation.messagesAddedToBlockchain == 0?"Unknown":(this.simulator.simulation.messagesAddedToBlockchain/(Date.now()-this.simulator.simulation.startTime)*1000).toFixed(3)} mgs/s<br/>`
                

            /*

            TODO: ADD MORE METRICS

            Stress Metrics
            - Maximum nodes in the system

            Performance Metrics
            - Average Message Delivery Time (and Percentiles)
            - Lost Messages Ratio
            - Maximum Throughput (messages/second/node)
            - Average Throughput (messages/second/node)
            - Average fully updated node ratio (how many nodes know the full blockchain)

            Goals:
            - Compare no-blockchain to blockchain
            - Compare "perfect" scnario to "potentialy-malicious" scenario


            CALCULATE DEBIT WIITH 0 PAYLOAD
            WHAT IS THE IDEAL BLOCK AND TRANSACTION SIZE
            ANALYZE STATIC SCENARIO

            */


        },this.LEFT_TAB_UPDATE_PERIOD)

        this.updateBlockchainState()
    }

    updateBlockchainState(){
        if (this.bcStateContent == null){
            return
        }
        this.bcStateContent.innerHTML = ""
        for (const block of this.simulator.simulation.globalBlockchain.blocks){
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
    
    //timeout in milliseconds
    addNodeEvent(node,description,timeout){
        const newNodeEvent = new NodeEvent(node,description,timeout)
        if(this.allEventsList == null){
            this.allEventsList = []
        }
        this.allEventsList.push(newNodeEvent)
        if (node == null){
            return
        }
        if(node.events == null){
            node.events = []
        }
        node.events.push(newNodeEvent)
        this.updateNodeEvents()
        if(timeout > 0){
            setTimeout(()=>{
                node.events.pop(newNodeEvent)
                this.updateNodeEvents()
            },timeout)
        }
    }
}




class NodeEvent{
    constructor(node,description,timeout){
        this.node = node;
        this.description = description;
        this.timeout = timeout; //In milliseconds
        this.timestamp = Date.now()
    }
}

