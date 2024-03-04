class RandomMessageSimulation extends Simulation{
    constructor(node_amount){
        super()

        this.genesisNode = null;

        for (let i = 0; i < node_amount; i++){
            let new_node = null;
            if (i==0){
                new_node = new RandomMessageNode(this,`Node ${i}`,0,0,0,true)
                this.genesisNode = new_node
            }else{
                new_node = new RandomMessageNode(this,`Node ${i}`,0,0,0,false)
            }
            this.nodeList.push(new_node)
        }

        this.genesisNode.protocolList[1].initializeBlockchain()

        this.dashboard = new Dashboard(this)
        this.dashboard.beginUpdates()
    }

    draw(){
        for(const node of this.nodeList){
            node.draw()
        }
    }
}