class Camera{
    constructor(canvas){
        perspective(PI / 3, width / height, 1, 100000);
        this.position = new Vec3(0,0,-1000)
        this.rotation = new Vec3(0,0,0)
        this.cameraSpeed = 10;
        this.cameraAngularSpeed = Math.PI / 100
        this.mouseSensitivity = 0.1

        this.dragging = false

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

        canvas.addEventListener('mousedown', (event) => {
            this.dragging = true;
        });

        document.addEventListener('mousemove', (event) => {
            if (this.dragging) {
                let horizontalMovement = event.movementX;
                let verticalMovement = event.movementY;
                if (event.shiftKey) {
                    this.position.x += horizontalMovement * this.cameraSpeed * this.mouseSensitivity;
                    this.position.y += verticalMovement * this.cameraSpeed * this.mouseSensitivity;
                }else{
                this.rotation.y += horizontalMovement * this.cameraAngularSpeed * this.mouseSensitivity;
                this.rotation.x -= verticalMovement * this.cameraAngularSpeed * this.mouseSensitivity;
                }
            }
        });

        document.addEventListener('mouseup', (event) => {
            this.dragging = false;
        });

        canvas.addEventListener('wheel', (event) => {
            this.position.z -= event.deltaY * this.cameraSpeed * this.mouseSensitivity;
        });
    }

    moveToCameraPOV(){
        translate(this.position.x,this.position.y,this.position.z)
        rotateX(this.rotation.x)
        rotateY(this.rotation.y)
    }
}