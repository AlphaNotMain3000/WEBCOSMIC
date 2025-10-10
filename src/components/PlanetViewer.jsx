import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

// Define planets and their model paths (relative to /public/models/)
const PLANETS = [
  { name: "Earth", file: "/models/earth.glb" },
  { name: "Moon", file: "/models/moon.glb" },
  { name: "Mars", file: "/models/mars.glb" },
  { name: "Venus", file: "/models/venus.glb" },
  { name: "Saturn", file: "/models/saturn.glb" },
  { name: "Jupiter", file: "/models/jupiter.glb" },
  { name: "Sun", file: "/models/sun.glb" },
];

const PlanetViewer = () => {
  const mountRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const controlsRef = useRef();
  const planetRef = useRef();
  const loader = new GLTFLoader();
  const [loading, setLoading] = useState(false);
  const [activePlanet, setActivePlanet] = useState("Earth");
  const initializedRef = useRef(false);

  useEffect(() => {
     if (initializedRef.current) return; // prevent double initialization
    initializedRef.current = true;
    // === Setup Scene ===
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // === Setup Camera ===
    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1, 3);
    cameraRef.current = camera;

    // === Setup Renderer ===
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // === Lighting ===
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0x404040));

    // === Controls ===
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // === Animation Loop ===
    const animate = () => {
      requestAnimationFrame(animate);
      if (planetRef.current) planetRef.current.rotation.y += 0.001;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // === Handle Resize ===
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

    const menuButtons = document.querySelectorAll(".menubutton");
    menuButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const planet = e.target.dataset.planet;
        if (!planet) return;
        const match = PLANETS.find(
          (p) => p.name.toLowerCase() === planet.toLowerCase()
        );
        if (match) {
          setActivePlanet(match.name);
          loadPlanet(match.file);
        }
      });
    });

    // === Cleanup ===
    return () => {
      window.removeEventListener("resize", handleResize);
      menuButtons.forEach((btn) =>
        btn.removeEventListener("click", () => {})
      );
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      if (planetRef.current) disposeObject3D(planetRef.current);
    };
    // eslint-disable-next-line
  }, []);

  // === Dispose Helper ===
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

  // === Center & Scale Model ===
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

  // === Load Planet ===
  const loadPlanet = (() => {
  let currentLoadId = 0;

  return (file) => {
    if (!sceneRef.current) return;
    setLoading(true);

    const loadId = ++currentLoadId;

    // Remove previous planet
    if (planetRef.current) {
      sceneRef.current.remove(planetRef.current);
      disposeObject3D(planetRef.current);
      planetRef.current = null;
    }

    loader.load(
      file,
      (gltf) => {
        // Ignore if another load started meanwhile
        if (loadId !== currentLoadId) {
          disposeObject3D(gltf.scene);
          return;
        }

        const planet = gltf.scene;

        planet.traverse((child) => {
          if (child.isMesh) {
            const map = child.material?.map || null;
            child.material = new THREE.MeshStandardMaterial({
              map,
              roughness: 0.7,
              metalness: 0.1,
              emissive: new THREE.Color(0x000000),
            });
            if (map) {
              map.colorSpace = THREE.SRGBColorSpace;
              map.needsUpdate = true;
            }
          }
        });

        centerAndFit(planet);
        sceneRef.current.add(planet);
        planetRef.current = planet;
        setLoading(false);
      },
      undefined,
      (err) => {
        if (loadId === currentLoadId) setLoading(false);
        console.error("GLB load error:", err);
      }
    );
  };
})();



  // === Handle Planet Button Click ===
  const handlePlanetClick = (p) => {
    setActivePlanet(p.name);
    loadPlanet(p.file);
  };

  return (
    <div style={{ padding: "5%", width: "50em", height: "100%", color: "#fff" }}>
      {/* Planet Buttons */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
      </div>

      {/* 3D Canvas */}
      <div
        ref={mountRef}
        style={{
          width: "100%",
          height: "600px",
          background: "#0a0a0a",
          borderRadius: 12,
          position: "relative",
        }}
      >
        {/* Loading Spinner */}
        {loading && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "#fff",
              fontSize: 18,
              background: "rgba(0,0,0,0.6)",
              padding: "12px 24px",
              borderRadius: 8,
            }}
          >
            Loading...
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanetViewer;
