class Camera{
    constructor(){
        this.position = new Vec3(0,0,0)
        this.rotation = new Vec3(0,0,0)
        this.cameraSpeed = 10;
        this.cameraAngularSpeed = Math.PI / 100

        document.addEventListener("keydown",(event)=>{
            if(event.key == 'a'){
                this.position.x += this.cameraSpeed
            }else if(event.key == 'd'){
                this.position.x -= this.cameraSpeed
            }else if(event.key == 'w'){
                this.position.z += this.cameraSpeed
            }else if(event.key == 's'){
                this.position.z -= this.cameraSpeed
            }else if(event.key == 'ArrowUp' && this.rotation.x > -Math.PI/2){
                this.rotation.x -= this.cameraAngularSpeed
            }else if(event.key == 'ArrowDown' && this.rotation.x < Math.PI/2){
                this.rotation.x += this.cameraAngularSpeed
            }else if(event.key == 'ArrowLeft'){
                this.rotation.y += this.cameraAngularSpeed
            }else if(event.key == 'ArrowRight'){
                this.rotation.y -= this.cameraAngularSpeed
            }
        })
    }

    moveToCameraPOV(){
        translate(this.position.x,this.position.y,this.position.z)
        rotateX(this.rotation.x)
        rotateY(this.rotation.y)
    }
}