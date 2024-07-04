import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
export class Camera extends THREE.PerspectiveCamera
{
    constructor()
    {
        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 1.0;
        const far = 1000.0;
        super(fov,aspect,near,far);

        this.position.set(0,60,-100);
        this.lookAt(0,40,0);
    }
}