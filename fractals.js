'use strict';
console.log(THREE);

class Transformer {
  constructor() {
    this.dampingFactor_ = 5.0;
    this.crimpingFactor_ = 0.3;
    this.crimpingConstant_ = 0.3;
    this.branchingAngle_ = 0.6;
  }

  set branchingAngle(val) {
    this.branchingAngle_ = val;
    fractal.update();
  }
  get branchingAngle() {
    return this.branchingAngle_;
  }

  set crimpingFactor(val) {
    this.crimpingFactor_ = val;
    fractal.update();
  }
  get crimpingFactor() {
    return this.crimpingFactor_;
  }

  set crimpingConstant(val) {
    this.crimpingConstant_ = val;
    fractal.update();
  }
  get crimpingConstant() {
    return this.crimpingConstant_;
  }

  set dampingFactor(val) {
    this.dampingFactor_ = val;
    fractal.update();
  }
  get dampingFactor() {
    return this.dampingFactor_;
  }

  transformFn(location, directionVector, numChildren, i) {
    // console.log(location.y);
    // console.log(directionVector.y);
    // console.log(i);
    let dampingFactor = 1 / this.dampingFactor_;
    const angleBetweenChildren = this.branchingAngle_;
    const directionVectorAngle = Math.atan2(directionVector.y, directionVector.x);
    const angleSweep = angleBetweenChildren * (numChildren - 1);
    const child0Angle = angleSweep / 2;
    const angle = child0Angle - i * angleBetweenChildren
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);
    dampingFactor /= (this.crimpingFactor * Math.abs(angle) + this.crimpingConstant);
    // console.log(sinA);
    const result = {
      x: location.x + (directionVector.x * cosA - directionVector.y * sinA) * dampingFactor,
      y: location.y + (directionVector.x * sinA + directionVector.y * cosA) * dampingFactor,
      z: location.z + directionVector.z,
    }
    // console.log(result);
    return result;
  }
}
const transformer = new Transformer();

const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00870d
      })

class FractalNode {
  constructor(scene, material, depth, maxDepth, location, directionVector, numChildren) {
    this.scene = scene;
    this.numChildren = numChildren;
    this.depth = depth;
    this.maxDepth = maxDepth;
    this.location = location;
    this.directionVector = directionVector;
    // this.geometry = new THREE.SphereGeometry(0.1 / depth, 16, 16);
    // this.material = material;
    // this.mesh = new THREE.Mesh(this.geometry, this.material);
    // this.mesh.position.set(location.x, location.y, location.z);
    // scene.add(this.mesh);
    this.children = [];
    this.lines = [];
    if (depth < maxDepth) {
      this.createChildren();
      this.update();
    }
    // this.hide();
    // this.show();
  }
  
  createChildren() {
    for (let i = 0; i < this.numChildren; i ++) {
      const childLocation = transformer.transformFn(this.location, this.directionVector, this.numChildren, i);
      const childDirectionVector = { 
        x: childLocation.x - this.location.x,
        y: childLocation.y - this.location.y,
        z: childLocation.z - this.location.z,
      }
      const child = new FractalNode(this.scene, this.material, this.depth + 1, this.maxDepth, childLocation, childDirectionVector, this.numChildren);
      this.children.push(child);
    }
  }
                                    
  hide() {
    this.mesh.visible = false;
  }
  show() {
    this.mesh.visible = true;
  }

  update() {
    for (let i = 0; i < this.children.length; i++) {
      const childLocation = transformer.transformFn(this.location, this.directionVector, this.numChildren, i);
      const childDirectionVector = { 
        x: childLocation.x - this.location.x,
        y: childLocation.y - this.location.y,
        z: childLocation.z - this.location.z,
      }
      const child = this.children[i];
      child.location = childLocation;
      child.directionVector = childDirectionVector;
      child.update();
      if (this.lines[i]) {
        this.lines[i].geometry.vertices[0].set(this.location.x, this.location.y, this.location.z);
        this.lines[i].geometry.vertices[1].set(child.location.x, child.location.y, child.location.z);
        this.lines[i].geometry.verticesNeedUpdate = true;
        this.lines[i].geometry.computeLineDistances();
        this.lines[i].geometry.lineDistancesNeedUpdate = true;
      }
      else {
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(this.location.x, this.location.y, this.location.z));
        geometry.vertices.push(new THREE.Vector3(child.location.x, child.location.y, child.location.z));
        var line = new THREE.Line(geometry, lineMaterial);
        line.frustumCulled = false;
        scene.add(line);
        this.lines.push(line);
      }
    }
  }
}

class Fractal {
  constructor(scene, material, numChildren, maxDepth) {
    this.scene = scene;
    this.stemLength_ = 3;
    this.node = new FractalNode(scene, material, 0, maxDepth, {x: 0, y: 0, z: 0}, {x: 0, y: this.stemLength_, z: 0}, numChildren);
  }
  update() {
    this.node.update();
  }
  set stemLength(val) {
    this.stemLength_ = val;
    this.node.directionVector.y = val;
    this.update();
  }
  get stemLength() {
    return this.stemLength_;
  }
}

var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 100);
camera.lookAt(new THREE.Vector3(0, 0, 0));
camera.setFocalLength(40);

const ambientLight = new THREE.AmbientLight( 0x40404 );
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xFFFFFF);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

const material = new THREE.MeshNormalMaterial({
                  color: '#ffffff',
                });
const fractal = new Fractal(scene, material, 7, 5);


var meter = new FPSMeter(null, {
    top: '2em',
    left: '1em',
    theme: 'dark',
    graph: 1,
    heat: 1,
    history: 20
});

const controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.rotateSpeed = 10;
controls.zoomSpeed = 1.2;
controls.noZoom = false;
controls.noPan = true;
controls.staticMoving = false;
controls.dynamicDampingFactor = 0.15;
controls.minDistance = 1;
controls.maxDistance = 300;


var gui = new dat.GUI({});
gui.add(transformer, 'dampingFactor', 1.0, 10.0);
gui.add(transformer, 'crimpingFactor', 0.0, 1.5);
gui.add(transformer, 'crimpingConstant', 0.3, 1.5);
gui.add(transformer, 'branchingAngle', 0.1, 3.14);

function renderFrame() {
  requestAnimationFrame(renderFrame);
  controls.update()
  renderer.render(scene, camera);
  meter.tick();
}

renderFrame();
