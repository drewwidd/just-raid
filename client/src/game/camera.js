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

        this.position.set(0,100,-100);
        this.lookAt(0,40,0);
    }
}
export class ThirdPartyCamera
{
    constructor(params)
    {
        this.params = params;
        this.camera = params.camera;

        this.currentPosition = new THREE.Vector3();
        this.currentLookat = new THREE.Vector3();
    }

    CalculateIdealOffset()
    {
        const idealOffset = new THREE.Vector3(-80, 35, 0);
        idealOffset.applyQuaternion(this.params.target.quaternion);
        idealOffset.add(this.params.target.position);
        return idealOffset;
    }

    CalculateIdealLookat()
    {
        const idealLookat = new THREE.Vector3(0, 0, 0);
        idealLookat.applyQuaternion(this.params.target.quaternion);
        idealLookat.add(this.params.target.position);
        return idealLookat;
    }

    Update(timeElapsed)
    {
        const idealOffset = this.CalculateIdealOffset();
        const idealLookat = this.CalculateIdealLookat();
    
        const t = 1.0 - Math.pow(0.001, timeElapsed);
    
        this.currentPosition.lerp(idealOffset, t);
        this.currentLookat.lerp(idealLookat, t);
    
        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookat);
    }
}