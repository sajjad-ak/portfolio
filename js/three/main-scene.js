import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Scene setup
let scene, camera, renderer, controls;
let mixer, clock;
let car, terrain;
let isInitialized = false;
let animationId;

// DOM element that will hold the scene
const container = document.getElementById('three-container');

// Initialize the scene
export function init() {
    if (isInitialized) return;
    isInitialized = true;

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827); // Dark background matching our theme

    // Setup camera
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(5, 5, 10);

    // Setup renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Setup controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 5;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2;

    // Setup lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Add some particles for a space-like effect
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const posArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 50;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.1,
        color: 0x818cf8, // Light indigo color
        transparent: true,
        opacity: 0.8
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Add a simple terrain
    const terrainGeometry = new THREE.PlaneGeometry(30, 30, 32, 32);
    const terrainMaterial = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        wireframe: false,
        side: THREE.DoubleSide
    });
    
    terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Add a simple car placeholder (cube for now)
    // We'll replace this with a proper model later
    const carGeometry = new THREE.BoxGeometry(1, 0.5, 2);
    const carMaterial = new THREE.MeshStandardMaterial({
        color: 0x4f46e5, // Indigo color
        metalness: 0.5,
        roughness: 0.5
    });
    
    car = new THREE.Mesh(carGeometry, carMaterial);
    car.position.y = 0.5;
    car.castShadow = true;
    scene.add(car);

    // Add wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 32);
    const wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        metalness: 0.5,
        roughness: 0.7
    });
    
    const wheelPositions = [
        { x: -0.5, y: 0.3, z: 0.7 },
        { x: 0.5, y: 0.3, z: 0.7 },
        { x: -0.5, y: 0.3, z: -0.7 },
        { x: 0.5, y: 0.3, z: -0.7 }
    ];
    
    wheelPositions.forEach(position => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(position.x, position.y, position.z);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        car.add(wheel);
    });

    // Setup clock for animations
    clock = new THREE.Clock();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();
}

// Animation loop
function animate() {
    animationId = requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    // Rotate car slightly
    if (car) {
        car.rotation.y += 0.01;
    }
    
    // Render scene
    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Clean up resources
export function dispose() {
    if (!isInitialized) return;
    
    // Stop animation loop
    cancelAnimationFrame(animationId);
    
    // Remove event listeners
    window.removeEventListener('resize', onWindowResize);
    
    // Dispose of resources
    scene.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
            } else {
                object.material.dispose();
            }
        }
    });
    
    // Remove renderer
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    
    // Reset variables
    scene = null;
    camera = null;
    renderer = null;
    controls = null;
    mixer = null;
    clock = null;
    car = null;
    terrain = null;
    isInitialized = false;
}
