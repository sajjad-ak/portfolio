// Simple Three.js scene
console.log('Simple Three.js script loaded');

// Wait for the page to fully load
window.addEventListener('load', function() {
    console.log('Window loaded in simple-three.js');
    initSimpleScene();
});

function initSimpleScene() {
    console.log('Initializing simple scene...');
    
    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.error('Three.js is not loaded in simple-three.js!');
        return;
    }
    
    // Get the container
    const container = document.getElementById('three-container');
    if (!container) {
        console.error('Container not found!');
        return;
    }
    
    console.log('Container found, dimensions:', container.clientWidth, 'x', container.clientHeight);
    
    // Create scene, camera, and renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827);
    
    const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.z = 5;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    
    console.log('Renderer created and added to container');
    
    // Add a simple cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x4f46e5 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    
    console.log('Cube added to scene');
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Rotate the cube
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        
        renderer.render(scene, camera);
    }
    
    // Start animation
    animate();
    console.log('Animation started');
    
    // Handle window resize
    window.addEventListener('resize', function() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}
