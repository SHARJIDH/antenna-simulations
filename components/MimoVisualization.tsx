/* eslint-disable */
import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const MIMO3DVisualization = dynamic(
  () =>
    Promise.resolve(({ antennaConfig, isSimulating }) => {
      const mountRef = useRef(null);
      const sceneRef = useRef(null);
      const frameIdRef = useRef(null);
      const signalPathsRef = useRef([]);
      const particleSystemsRef = useRef([]);

      useEffect(() => {
        const THREE = require("three");

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a);
        const camera = new THREE.PerspectiveCamera(
          75,
          mountRef.current.clientWidth / mountRef.current.clientHeight,
          0.1,
          1000
        );
        const renderer = new THREE.WebGLRenderer({ antialias: true });

        renderer.setSize(
          mountRef.current.clientWidth,
          mountRef.current.clientHeight
        );
        renderer.shadowMap.enabled = true;
        mountRef.current.appendChild(renderer.domElement);

        // Enhanced camera position
        camera.position.set(6, 4, 6);
        camera.lookAt(0, 0, 0);

        // Improved lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        const spotLight = new THREE.SpotLight(0xffffff, 1);
        spotLight.position.set(5, 8, 5);
        spotLight.castShadow = true;
        spotLight.shadow.bias = -0.0001;
        spotLight.shadow.mapSize.width = 2048;
        spotLight.shadow.mapSize.height = 2048;
        scene.add(ambientLight, spotLight);

        // Enhanced ground plane
        const groundGeometry = new THREE.PlaneGeometry(15, 15);
        const groundMaterial = new THREE.MeshStandardMaterial({
          color: 0x222222,
          roughness: 0.8,
          metalness: 0.2,
          side: THREE.DoubleSide,
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = Math.PI / 2;
        ground.position.y = -2;
        ground.receiveShadow = true;
        scene.add(ground);

        // Grid helper
        const grid = new THREE.GridHelper(15, 15, 0x444444, 0x333333);
        grid.position.y = -1.99;
        scene.add(grid);

        // Create detailed antenna model
        const createDetailedAntenna = (color) => {
          const group = new THREE.Group();

          // Base plate
          const basePlateGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.4);
          const basePlateMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.8,
          });
          const basePlate = new THREE.Mesh(
            basePlateGeometry,
            basePlateMaterial
          );
          basePlate.castShadow = true;
          basePlate.receiveShadow = true;

          // Main stand
          const standGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.3, 8);
          const standMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.5,
            metalness: 0.8,
          });
          const stand = new THREE.Mesh(standGeometry, standMaterial);
          stand.position.y = 0.175;
          stand.castShadow = true;

          // Antenna element
          const elementGeometry = new THREE.CylinderGeometry(
            0.02,
            0.02,
            1.2,
            8
          );
          const elementMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.9,
            emissive: color,
            emissiveIntensity: 0.3,
          });
          const element = new THREE.Mesh(elementGeometry, elementMaterial);
          element.position.y = 0.9;
          element.castShadow = true;

          // Top cap
          const capGeometry = new THREE.SphereGeometry(0.025, 8, 8);
          const capMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.9,
            emissive: color,
            emissiveIntensity: 0.5,
          });
          const cap = new THREE.Mesh(capGeometry, capMaterial);
          cap.position.y = 1.5;
          cap.castShadow = true;

          group.add(basePlate, stand, element, cap);
          return group;
        };

        // Create particle system for signal visualization
        const createSignalParticles = (startPos, endPos, color) => {
          const particleCount = 50;
          const particles = new Float32Array(particleCount * 3);
          const particleGeometry = new THREE.BufferGeometry();
          const particleMaterial = new THREE.PointsMaterial({
            color: color,
            size: 0.05,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
          });

          for (let i = 0; i < particleCount; i++) {
            particles[i * 3] = startPos.x;
            particles[i * 3 + 1] = startPos.y;
            particles[i * 3 + 2] = startPos.z;
          }

          particleGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(particles, 3)
          );
          const particleSystem = new THREE.Points(
            particleGeometry,
            particleMaterial
          );
          scene.add(particleSystem);

          return {
            system: particleSystem,
            startPos: startPos,
            endPos: endPos,
            particles: particles,
            count: particleCount,
          };
        };

        // Create transmit antennas
        const txAntennas = [];
        for (let i = 0; i < antennaConfig.tx; i++) {
          const antenna = createDetailedAntenna(0x00aaff);
          antenna.position.set(i - (antennaConfig.tx - 1) / 2, 0, -2);
          scene.add(antenna);
          txAntennas.push(antenna);
        }

        // Create receive antennas
        const rxAntennas = [];
        for (let i = 0; i < antennaConfig.rx; i++) {
          const antenna = createDetailedAntenna(0xff4444);
          antenna.position.set(i - (antennaConfig.rx - 1) / 2, 0, 2);
          scene.add(antenna);
          rxAntennas.push(antenna);
        }

        // Create signal paths between antennas
        txAntennas.forEach((tx) => {
          rxAntennas.forEach((rx) => {
            const particles = createSignalParticles(
              new THREE.Vector3(
                tx.position.x,
                tx.position.y + 1.5,
                tx.position.z
              ),
              new THREE.Vector3(
                rx.position.x,
                rx.position.y + 1.5,
                rx.position.z
              ),
              0x88ccff
            );
            particleSystemsRef.current.push(particles);
          });
        });

        // Animation
        let time = 0;
        const animate = () => {
          frameIdRef.current = requestAnimationFrame(animate);
          time += 0.016;

          if (isSimulating) {
            // Subtle antenna movement
            txAntennas.forEach((antenna) => {
              antenna.rotation.y = Math.sin(time * 2) * 0.1;
            });
            rxAntennas.forEach((antenna) => {
              antenna.rotation.y = Math.cos(time * 2) * 0.1;
            });

            // Animate particles
            particleSystemsRef.current.forEach((particleSystem) => {
              const positions =
                particleSystem.system.geometry.attributes.position.array;

              for (let i = 0; i < particleSystem.count; i++) {
                const t = (time + i / particleSystem.count) % 1;
                positions[i * 3] =
                  particleSystem.startPos.x +
                  (particleSystem.endPos.x - particleSystem.startPos.x) * t;
                positions[i * 3 + 1] =
                  particleSystem.startPos.y +
                  (particleSystem.endPos.y - particleSystem.startPos.y) * t +
                  Math.sin(t * Math.PI) * 0.5; // Arc height
                positions[i * 3 + 2] =
                  particleSystem.startPos.z +
                  (particleSystem.endPos.z - particleSystem.startPos.z) * t;
              }

              particleSystem.system.geometry.attributes.position.needsUpdate =
                true;
              particleSystem.system.material.opacity = isSimulating ? 0.6 : 0;
            });
          }

          renderer.render(scene, camera);
        };

        animate();
        sceneRef.current = { scene, camera, renderer };

        // Cleanup
        return () => {
          cancelAnimationFrame(frameIdRef.current);
          mountRef.current?.removeChild(renderer.domElement);
          particleSystemsRef.current = [];
        };
      }, [antennaConfig, isSimulating]);

      useEffect(() => {
        const handleResize = () => {
          if (sceneRef.current) {
            const { camera, renderer } = sceneRef.current;
            camera.aspect =
              mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(
              mountRef.current.clientWidth,
              mountRef.current.clientHeight
            );
          }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
      }, []);

      return <div ref={mountRef} className="h-full w-full" />;
    }),
  { ssr: false }
);

export default MIMO3DVisualization;
