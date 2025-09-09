import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.164/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.164/examples/jsm/loaders/GLTFLoader.js";

let scene, camera, renderer, controls;
let currentPlanet = null; // will hold the loaded model
const loader = new GLTFLoader();

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1, 3);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lighting
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 5, 5);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x404040));

  controls = new OrbitControls(camera, renderer.domElement);

  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Function to load a planet model
window.loadPlanet = function (path) {
  if (currentPlanet) {
    scene.remove(currentPlanet);
    currentPlanet.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    currentPlanet = null;
  }

  loader.load(path, (gltf) => {
    currentPlanet = gltf.scene;
    currentPlanet.scale.set(1, 1, 1);
    scene.add(currentPlanet);
  });
};

function animate() {
  requestAnimationFrame(animate);

  if (currentPlanet) {
    currentPlanet.rotation.y += 0.002; // slow rotation
  }

  controls.update();
  renderer.render(scene, camera);
}
