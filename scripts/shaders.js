const oceanVertexShader = `
attribute vec3 aPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
varying float vDepth;

void main() {
    vec4 positionVec4 = uModelViewMatrix * vec4(aPosition, 1.0);
    gl_Position = uProjectionMatrix * positionVec4;
    vDepth = -positionVec4.z; // Pass fragment depth to fragment shader
}
`;

const oceanFragmentShader = `
precision mediump float;
uniform float fogDensity;
uniform bool uFloorPlane;
varying float vDepth;

void main() {
    
    float depth = vDepth / fogDensity; // Scale depth for better color modulation
    float othersAmount = 1.0 - smoothstep(0.0, 0.4, depth)*0.4; // Invert depth for blue modulation
    if (uFloorPlane) { // If the fragment is part of the floor plane
        gl_FragColor = vec4(0.0,0.0,0.0, 1.0); // Output black color
    }else{
        gl_FragColor = vec4(0.0, othersAmount, othersAmount, 1.0); // Output blue color based on depth
    }
}
`;