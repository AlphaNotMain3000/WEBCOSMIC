import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const PLANETS = [
  { name: "Earth", file: "../models/earth.glb" },
  { name: "Moon", file: "../models/moon.glb" },
  { name: "Mars", file: "../models/mars.glb" },
  { name: "Venus", file: "../models/venus.glb" },
  { name: "Saturn", file: "../models/saturn.glb" },
  { name: "Jupiter", file: "../models/jupiter.glb" },
  { name: "Sun", file: "../models/sun.glb" },
];

const PlanetViewer = () => {
  const mountRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const controlsRef = useRef();
  const planetRef = useRef();
  const loader = new GLTFLoader();

  useEffect(() => {
    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1, 3);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0x404040));

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // Load default planet
    loadPlanet("earth.glb");

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (planetRef.current) planetRef.current.rotation.y += 0.002;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect =
        mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight
      );
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      if (planetRef.current) disposeObject3D(planetRef.current);
    };
    // eslint-disable-next-line
  }, []);

  // Helper: dispose previous model
  function disposeObject3D(obj) {
    obj.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        const mats = Array.isArray(child.material)
          ? child.material
          : [child.material];
        mats.forEach((m) => {
          if (!m) return;
          if (m.map) m.map.dispose();
          m.dispose();
        });
      }
    });
  }

  // Helper: center and scale model
  function centerAndFit(object) {
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    object.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 1.5 / maxDim : 1;
    object.scale.setScalar(scale);
  }

  // Load a planet GLB
  function loadPlanet(file) {
    if (!sceneRef.current) return;
    if (planetRef.current) {
      sceneRef.current.remove(planetRef.current);
      disposeObject3D(planetRef.current);
      planetRef.current = null;
    }
    loader.load(
      `/models/${file}`,
      (gltf) => {
        const planet = gltf.scene;
        centerAndFit(planet);
        sceneRef.current.add(planet);
        planetRef.current = planet;
      },
      undefined,
      (err) => console.error("GLB load error:", err)
    );
  }

  // Button click handler
  const handlePlanetClick = (file) => {
    loadPlanet(file);
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 8,
          marginBottom: 8,
        }}
      >
        {PLANETS.map((p) => (
          <button key={p.name} onClick={() => handlePlanetClick(p.file)}>
            {p.name}
          </button>
        ))}
      </div>
      <div
        id="canvas"
        ref={mountRef}
        style={{
          width: "100%",
          height: "600px",
          background: "#c7efdc",
          borderRadius: 12,
        }}
      ></div>
    </div>
  );
};

export default PlanetViewer;
