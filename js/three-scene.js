// Simple Three.js scene for the portfolio
let scene, camera, renderer, controls;
let car, terrain;
let isInitialized = false;
let animationId;
let keys = {};
let carVelocity = 0;
let currentSectionId = null;
let lastZoneTriggerTime = 0;
let carDistance = 0;
let carIntroElement = null;
let carIntroFullText = '';
let carIntroCharsShown = 0;
let hasUserDriven = false;
const MAX_SPEED = 0.35;
const ACCELERATION = 0.02;
const FRICTION = 0.94;
const TURN_SPEED = 0.06;
const SECTION_ZONES = [
    { sectionId: 'home', x: 0, z: 0, radius: 3 },
    { sectionId: 'experience', x: -8, z: 4, radius: 3 },
    { sectionId: 'projects', x: 8, z: 4, radius: 3 },
    { sectionId: 'skills', x: -8, z: -4, radius: 3 },
    { sectionId: 'contact', x: 8, z: -4, radius: 3 }
];
const SECTION_LABELS = {
    home: 'Home',
    experience: 'Experience',
    projects: 'Projects',
    skills: 'Skills',
    contact: 'Contact'
};
let sectionLabels = [];

// Initialize the Three.js scene
function initThreeScene() {
    console.log('Initializing Three.js scene...');
    if (isInitialized) return;
    
    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.error('Three.js is not loaded!');
        return;
    }
    
    console.log('Three.js is loaded successfully.');
    
    const container = document.getElementById('three-container');
    if (!container) return;
    
    isInitialized = true;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    carIntroElement = document.getElementById('car-intro');
    if (carIntroElement) {
        const fromData = carIntroElement.getAttribute('data-full-text');
        carIntroFullText = (fromData && fromData.trim().length > 0)
            ? fromData.trim()
            : carIntroElement.textContent.trim();
        carIntroElement.textContent = '';
        carIntroCharsShown = 0;
        carDistance = 0;
    }

    // Avoid zone-based scrolling on page load. We'll enable it only after the user actually drives.
    hasUserDriven = false;
    currentSectionId = 'home';
    lastZoneTriggerTime = performance.now();

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Light background matching our theme

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

    // Setup controls if OrbitControls is available
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 5;
        controls.maxDistance = 20;
        controls.maxPolarAngle = Math.PI / 2;
    }

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

    if (typeof THREE.GLTFLoader !== 'undefined') {
        const loader = new THREE.GLTFLoader();
        loader.load(
            'models/car.glb',
            function (gltf) {
                const loadedCar = gltf.scene || (gltf.scenes && gltf.scenes[0]);
                if (!loadedCar) {
                    return;
                }
                loadedCar.traverse(function (node) {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                    }
                });
                loadedCar.position.copy(car.position);
                loadedCar.rotation.copy(car.rotation);
                scene.remove(car);
                car = loadedCar;
                scene.add(car);
            },
            undefined,
            function (error) {
                console.error('Failed to load car model:', error);
            }
        );
    }

    createSectionLabels();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();
}

// Animation loop
function animate() {
    animationId = requestAnimationFrame(animate);
    
    if (controls) {
        controls.update();
    }
    
    if (car) {
        updateCarMovement();
        updateCameraFollow();
        checkSectionZones();
    }

    if (sectionLabels.length && camera) {
        const time = performance.now() * 0.001;
        for (let i = 0; i < sectionLabels.length; i++) {
            const sprite = sectionLabels[i];
            const baseY = sprite.userData.baseY || 1.5;
            sprite.position.y = baseY + Math.sin(time + i) * 0.2;
            sprite.lookAt(camera.position);
        }
    }
    
    renderer.render(scene, camera);
}

function createSectionLabels() {
    for (let i = 0; i < SECTION_ZONES.length; i++) {
        const zone = SECTION_ZONES[i];
        const labelText = SECTION_LABELS[zone.sectionId] || zone.sectionId;
        const sprite = createTextSprite(labelText);
        sprite.position.set(zone.x, 1.5, zone.z);
        sprite.userData.baseY = sprite.position.y;
        sectionLabels.push(sprite);
        scene.add(sprite);
    }
}

function createTextSprite(message) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const fontSize = 64;
    context.font = fontSize + 'px Poppins, Arial, sans-serif';
    const textWidth = context.measureText(message).width;
    canvas.width = textWidth + 64;
    canvas.height = fontSize + 64;
    context.font = fontSize + 'px Poppins, Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = 'rgba(15, 23, 42, 0.9)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.fillText(message, canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    const scale = 2.5;
    sprite.scale.set(scale * (canvas.width / canvas.height), scale, 1);
    return sprite;
}

function onKeyDown(event) {
    keys[event.code] = true;
}

function onKeyUp(event) {
    keys[event.code] = false;
}

function updateCarMovement() {
    const forward = keys['KeyW'] || keys['ArrowUp'];
    const backward = keys['KeyS'] || keys['ArrowDown'];
    const turnLeft = keys['KeyA'] || keys['ArrowLeft'];
    const turnRight = keys['KeyD'] || keys['ArrowRight'];

    if (forward || backward || turnLeft || turnRight) {
        hasUserDriven = true;
    }

    if (forward) {
        carVelocity += ACCELERATION;
        if (carVelocity > MAX_SPEED) {
            carVelocity = MAX_SPEED;
        }
    }

    if (backward) {
        carVelocity -= ACCELERATION;
        if (carVelocity < -MAX_SPEED * 0.5) {
            carVelocity = -MAX_SPEED * 0.5;
        }
    }

    if (!forward && !backward) {
        carVelocity *= FRICTION;
        if (Math.abs(carVelocity) < 0.0001) {
            carVelocity = 0;
        }
    }

    if (carVelocity !== 0) {
        const direction = carVelocity > 0 ? 1 : -1;
        if (turnLeft) {
            car.rotation.y += TURN_SPEED * direction;
        }
        if (turnRight) {
            car.rotation.y -= TURN_SPEED * direction;
        }
    }

    const angle = car.rotation.y;
    const dx = Math.sin(angle) * carVelocity;
    const dz = Math.cos(angle) * carVelocity;
    car.position.x += dx;
    car.position.z += dz;

    if (forward) {
        const stepDistance = Math.sqrt(dx * dx + dz * dz);
        if (stepDistance > 0) {
            carDistance += stepDistance;
            updateCarIntroText();
        }
    }

    const limit = 14;
    if (car.position.x > limit) car.position.x = limit;
    if (car.position.x < -limit) car.position.x = -limit;
    if (car.position.z > limit) car.position.z = limit;
    if (car.position.z < -limit) car.position.z = -limit;
}

function updateCarIntroText() {
    if (!carIntroElement || !carIntroFullText) return;

    const charactersPerUnit = 12;
    const totalChars = carIntroFullText.length;
    const targetChars = Math.min(totalChars, Math.floor(carDistance * charactersPerUnit));

    if (targetChars <= carIntroCharsShown) {
        return;
    }

    carIntroCharsShown = targetChars;
    carIntroElement.textContent = carIntroFullText.slice(0, carIntroCharsShown);
}

function updateCameraFollow() {
    const distance = 10;
    const height = 5;
    const angle = car.rotation.y;
    const offsetX = Math.sin(angle) * -distance;
    const offsetZ = Math.cos(angle) * -distance;

    camera.position.x = car.position.x + offsetX;
    camera.position.y = car.position.y + height;
    camera.position.z = car.position.z + offsetZ;

    camera.lookAt(car.position.x, car.position.y + 1, car.position.z);
}

function checkSectionZones() {
    if (!car) return;

    // Do not auto-scroll while the user is simply browsing/scrolling the page.
    // Enable zone navigation only after the user has actively driven the car.
    if (!hasUserDriven) {
        return;
    }

    const x = car.position.x;
    const z = car.position.z;

    let activeZone = null;
    let minDistSq = Infinity;

    for (let i = 0; i < SECTION_ZONES.length; i++) {
        const zone = SECTION_ZONES[i];
        const dx = x - zone.x;
        const dz = z - zone.z;
        const distSq = dx * dx + dz * dz;
        if (distSq <= zone.radius * zone.radius && distSq < minDistSq) {
            minDistSq = distSq;
            activeZone = zone;
        }
    }

    if (!activeZone) {
        return;
    }

    const now = performance.now();
    if (activeZone.sectionId === currentSectionId && now - lastZoneTriggerTime < 1000) {
        return;
    }

    currentSectionId = activeZone.sectionId;
    lastZoneTriggerTime = now;
    scrollToSection(activeZone.sectionId);
}

function scrollToSection(sectionId) {
    const targetElement = document.getElementById(sectionId);
    if (!targetElement) return;

    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 0;
    const targetPosition = targetElement.offsetTop - headerHeight;

    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

// Handle window resize
function onWindowResize() {
    const container = document.getElementById('three-container');
    if (!container) return;
    
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Clean up resources
function disposeThreeScene() {
    if (!isInitialized) return;
    
    // Stop animation loop
    cancelAnimationFrame(animationId);
    
    // Remove event listeners
    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    
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
    if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
    }
    
    // Reset variables
    scene = null;
    camera = null;
    renderer = null;
    controls = null;
    car = null;
    terrain = null;
    isInitialized = false;
    keys = {};
    carVelocity = 0;
    currentSectionId = null;
    sectionLabels = [];
    carDistance = 0;
    carIntroElement = null;
    carIntroFullText = '';
    carIntroCharsShown = 0;
    hasUserDriven = false;
}
