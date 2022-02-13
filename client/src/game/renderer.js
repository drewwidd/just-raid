import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
export class Renderer extends THREE.WebGLRenderer
{
    constructor(canvas)
    {
        super({canvas});
        this.canvas = canvas;
        this.initalize();
    }

    initalize()
    {
        this.antialias = true;
        this.setClearColor("#e5e5e5");
        this.setSize(1920,1080);
        this.setPixelRatio(devicePixelRatio);
    }
    render(scene,camera)
    {
        this.render(scene,camera);
    }
}