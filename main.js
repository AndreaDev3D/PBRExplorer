import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// --- State Management ---
const state = {
    material: {
        map: null,
        normalMap: null,
        roughnessMap: null,
        metalnessMap: null,
        aoMap: null,
        displacementMap: null,
    },
    settings: {
        shape: 'cube',
        tiling: 1,
        displacementScale: 0.05,
        exposure: 1,
        roughness: 1,
        metalness: 0,
    },
    textureFiles: {
        map: null,
        normalMap: null,
        roughnessMap: null,
        metalnessMap: null,
        aoMap: null,
        displacementMap: null,
    }
};

const slots = [
    { id: 'map', label: 'Albedo / Map' },
    { id: 'normalMap', label: 'Normal' },
    { id: 'roughnessMap', label: 'Roughness' },
    { id: 'metalnessMap', label: 'Metallic' },
    { id: 'aoMap', label: 'AO' },
    { id: 'displacementMap', label: 'Height' },
];

// --- Three.js Setup ---
let scene, camera, renderer, controls, mesh, geometry;
const canvasContainer = document.getElementById('canvas-container');

function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);

    camera = new THREE.PerspectiveCamera(45, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 4);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = state.settings.exposure;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    canvasContainer.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    const grid = new THREE.GridHelper(40, 40, 0x18181b, 0x111111);
    grid.position.y = -1.5;
    scene.add(grid);

    updateGeometry();
    animate();
}

function updateGeometry() {
    if (mesh) {
        scene.remove(mesh);
    }

    switch (state.settings.shape) {
        case 'sphere':
            geometry = new THREE.SphereGeometry(1, 128, 128);
            break;
        case 'plane':
            geometry = new THREE.PlaneGeometry(2, 2, 512, 512);
            break;
        case 'cube':
        default:
            geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5, 128, 128, 128);
            break;
    }

    const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: state.settings.roughness,
        metalness: state.settings.metalness,
    });

    mesh = new THREE.Mesh(geometry, material);
    if (state.settings.shape === 'plane') {
        mesh.rotation.x = -Math.PI / 2;
    }
    scene.add(mesh);

    updateMaterial();
}

function updateMaterial() {
    if (!mesh) return;

    const mat = mesh.material;
    const hasTextures = Object.values(state.material).some(v => v !== null);

    // Update material properties
    mat.displacementScale = state.settings.displacementScale;
    mat.roughness = state.settings.roughness;
    mat.metalness = state.settings.metalness;

    // Apply textures
    slots.forEach(slot => {
        const tex = state.material[slot.id];
        if (tex) {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(state.settings.tiling, state.settings.tiling);

            if (slot.id === 'map') {
                tex.colorSpace = THREE.SRGBColorSpace;
            } else {
                tex.colorSpace = THREE.NoColorSpace;
            }
            tex.needsUpdate = true;
            mat[slot.id] = tex;
        } else {
            mat[slot.id] = null;
        }
    });

    // Handle initial color if no albedo map
    if (!state.material.map) {
        mat.color.set(0x27272a);
    } else {
        mat.color.set(0xffffff);
    }

    mat.needsUpdate = true;
    controls.autoRotate = !hasTextures;
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// --- UI Logic ---
function initUI() {
    renderTextureSlots();

    // Shape buttons
    document.querySelectorAll('.geometry-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.geometry-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.settings.shape = btn.dataset.shape;
            updateGeometry();
        });
    });

    // Parameter sliders
    const params = [
        { id: 'tiling', factor: 1, suffix: 'x' },
        { id: 'displacementScale', elementId: 'displacement', factor: 1, suffix: '' },
        { id: 'exposure', factor: 1, suffix: '' },
        { id: 'roughness', factor: 1, suffix: '' },
        { id: 'metalness', factor: 1, suffix: '' }
    ];

    params.forEach(p => {
        const id = p.elementId || p.id;
        const slider = document.getElementById(`param-${id}`);
        const input = document.getElementById(`val-${id}`);

        // Set initial display values
        slider.value = state.settings[p.id];
        input.value = state.settings[p.id];

        const updateAll = (val) => {
            state.settings[p.id] = val;

            if (p.id === 'exposure') {
                renderer.toneMappingExposure = val;
            } else {
                updateMaterial();
            }
        };

        // Slider -> Input & State
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            input.value = val;
            updateAll(val);
        });

        // Input -> Slider & State
        input.addEventListener('input', (e) => {
            let val = parseFloat(e.target.value);
            if (isNaN(val)) return;

            // Clamp to slider bounds
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            val = Math.max(min, Math.min(max, val));

            slider.value = val;
            updateAll(val);
        });
    });

    // Drag and Drop
    const dropZone = document.getElementById('drop-zone');
    const dragOverlay = document.getElementById('drag-overlay');

    window.addEventListener('dragover', (e) => {
        e.preventDefault();
        dragOverlay.classList.add('active');
    });

    dragOverlay.addEventListener('dragleave', () => {
        dragOverlay.classList.remove('active');
    });

    window.addEventListener('drop', (e) => {
        e.preventDefault();
        dragOverlay.classList.remove('active');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });

    window.addEventListener('resize', () => {
        camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    });
}

function renderTextureSlots() {
    const container = document.getElementById('texture-slots');
    container.innerHTML = '';

    slots.forEach(slot => {
        const file = state.textureFiles[slot.id];
        const slotEl = document.createElement('div');
        slotEl.className = `texture-slot ${file ? 'loaded' : ''}`;

        slotEl.innerHTML = `
            <div class="slot-info">
                <span class="slot-label">${slot.label}</span>
                <span class="slot-filename">${file ? file.name : 'Not loaded'}</span>
            </div>
            ${file ? `
                <button class="remove-btn" data-id="${slot.id}">
                    <i data-lucide="trash-2"></i>
                </button>
            ` : `
                <div class="slot-action">
                    <i data-lucide="upload"></i>
                </div>
            `}
        `;

        if (file) {
            slotEl.querySelector('.remove-btn').addEventListener('click', () => resetTexture(slot.id));
        }

        container.appendChild(slotEl);
    });

    lucide.createIcons();
}

function matchTextureType(filename) {
    const f = filename.toLowerCase();
    if (f.includes('albedo') || f.includes('diffuse') || f.includes('basecolor') || f.includes('color')) return 'map';
    if (f.includes('normal') || f.includes('nrm') || f.includes('nm')) return 'normalMap';
    if (f.includes('roughness') || f.includes('rough') || f.includes('rgh')) return 'roughnessMap';
    if (f.includes('metal') || f.includes('mtl')) return 'metalnessMap';
    if (f.includes('ao') || f.includes('ambientocclusion') || f.includes('occlusion')) return 'aoMap';
    if (f.includes('height') || f.includes('displacement') || f.includes('disp')) return 'displacementMap';
    return null;
}

const textureLoader = new THREE.TextureLoader();

function handleFiles(files) {
    Array.from(files).forEach(file => {
        const type = matchTextureType(file.name);
        if (type) {
            // Revoke old URL if exists
            if (state.material[type]) {
                state.material[type].dispose();
            }

            const url = URL.createObjectURL(file);
            textureLoader.load(url, (texture) => {
                state.material[type] = texture;
                state.textureFiles[type] = file;
                renderTextureSlots();
                updateMaterial();
            });
        }
    });
}

function resetTexture(type) {
    if (state.material[type]) {
        state.material[type].dispose();
        state.material[type] = null;
        state.textureFiles[type] = null;
        renderTextureSlots();
        updateMaterial();
    }
}

// --- Start ---
initThree();
initUI();
