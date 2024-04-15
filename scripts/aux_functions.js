class Vec3{
    constructor(x,y,z){
        if (typeof x != "number" || typeof y != "number" || typeof z != "number" ){
            console.error(`ERROR Vec3 received invalid inputs (${x},${y},${z})`)
        }
        this.x = x
        this.y = y
        this.z = z
        this.type = ""
    }

    norm(){
        return Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2) + Math.pow(this.z,2))
    }

    normalize(){
        const norm = this.norm()
        this.x /= norm
        this.y /= norm
        this.z /= norm
        return this
    }


    resize(length){
        if (typeof length != "number"){
            console.error(`ERROR Vec3.resize received invalid length (${length})`)
        }
        const norm = this.norm()
        this.x = this.x / norm * length
        this.y = this.y / norm * length
        this.z = this.z / norm * length
        return this
    }

    distance2(target_vec){
        if(!(target_vec instanceof Vec3)){
            console.error(`ERROR Vec3.distance2 received an invalid input (${target_vec})`)
        }
        return Math.sqrt(Math.pow(this.x-target_vec.x,2) + Math.pow(this.y-target_vec.y,2) + Math.pow(this.z-target_vec.z,2))
    }

    add(target_vec){
        if(!(target_vec instanceof Vec3)){
            console.error(`ERROR Vec3.add received an invalid input (${target_vec})`)
        }
        this.x += target_vec.x
        this.y += target_vec.y
        this.z += target_vec.z
    }

    clone(){
        return new Vec3(this.x,this.y,this.z)
    }

    toDegrees(){
        let v = new Vec3(this.x*180/Math.PI,this.y*180/Math.PI,this.z*180/Math.PI)
        v.type = this.type
        return v
    }

    static distance(vec1,vec2){
        if(!(vec1 instanceof Vec3) || !(vec2 instanceof Vec3)){
            console.error(`ERROR Vec3.distance received an invalid input (${vec1},${vec2})`)
        }
        return Math.sqrt(Math.pow(vec1.x-vec2.x,2) + Math.pow(vec1.y-vec2.y,2) + Math.pow(vec1.z-vec2.z,2))
    }

    static directionVector(source_vec,target_vec){
        if(!(source_vec instanceof Vec3) || !(target_vec instanceof Vec3)){
            console.error(`ERROR Vec3.directionVector received an invalid input (${source_vec},${target_vec})`)
        }
        return new Vec3(target_vec.x-source_vec.x,target_vec.y-source_vec.y,target_vec.z-source_vec.z)
    }

    static angleBetween(vec1,vec2){
        if(!(vec1 instanceof Vec3) || !(vec2 instanceof Vec3)){
            console.error(`ERROR Vec3.angleBetween received an invalid input (${vec1},${vec2})`)
        }
        return Math.acos((vec1.x*vec2.x + vec1.y*vec2.y + vec1.z*vec2.z)/(vec1.norm()*vec2.norm()))
    }

    static getRotationAngles(vec) {
        // Convert directional vector to Euler angles (yaw, pitch, roll)
        const yaw = Math.atan2(vec.x, vec.z);
        const pitch = Math.atan2(vec.y, Math.sqrt(vec.x**2 + vec.z**2));
        const roll = 0;  // Assuming no roll is needed
    
        return new Vec3(yaw, pitch, roll);
    }

    static xVec = new Vec3(1,0,0)
    static yVec = new Vec3(0,1,0)
    static zVec = new Vec3(0,0,1)

}



function disp(text,toggleVariable){
    if(toggleVariable == undefined){
        console.warn(`WARNING disp() used without boolean value (text = "${text}")`)
    }
    if(toggleVariable){console.log(text)}
}


function drawDebugAxis(){
    //DEBUG AXIS
    stroke(255,0,0)
    line(100,0,0,0,0,0)
    stroke(0,255,0)
    line(0,100,0,0,0,0)
    stroke(0,0,255)
    line(0,0,100,0,0,0)
}