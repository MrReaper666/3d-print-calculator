const densityPLA = 1.24; // g/cm³

let scene, camera, renderer, controls, mesh;

initViewer();

document.getElementById("stlFile").addEventListener("change", handleFile);

function initViewer() {
  const viewer = document.getElementById("viewer");

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  camera = new THREE.PerspectiveCamera(
    45,
    viewer.clientWidth / viewer.clientHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(viewer.clientWidth, viewer.clientHeight);
  viewer.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const light = new THREE.DirectionalLight(0xffffff, 0.8);
  light.position.set(1, 1, 1);
  scene.add(light);

  const grid = new THREE.GridHelper(100, 20, 0x444444, 0x222222);
  scene.add(grid);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById("stlStatus").textContent = file.name;

  const reader = new FileReader();
  reader.onload = e => {
    loadSTL(e.target.result);
    calculateVolume(e.target.result);
  };
  reader.readAsArrayBuffer(file);
}

function loadSTL(buffer) {
  const loader = new THREE.STLLoader();
  const geometry = loader.parse(buffer);

  if (mesh) scene.remove(mesh);

  geometry.computeBoundingBox();
  geometry.center();
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0x00c8ff,
    metalness: 0.2,
    roughness: 0.5
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Auto scale
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 50 / maxDim;
  mesh.scale.setScalar(scale);

  box.setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());

  camera.position.set(center.x, center.y, maxDim * 2);
  camera.lookAt(center);
  controls.target.copy(center);
  controls.update();
}

function calculateVolume(buffer) {
  const dv = new DataView(buffer);
  let triangles = (dv.byteLength - 84) / 50;
  let volume = 0;

  for (let i = 0; i < triangles; i++) {
    const o = 84 + i * 50 + 12;

    const v1 = readVertex(dv, o);
    const v2 = readVertex(dv, o + 12);
    const v3 = readVertex(dv, o + 24);

    volume += signedVolume(v1, v2, v3);
  }

  volume = Math.abs(volume) / 1000; // mm³ → cm³
  const weight = volume * densityPLA;

  document.getElementById("volume").textContent = volume.toFixed(2);
  document.getElementById("weight").textContent = weight.toFixed(1);
  document.getElementById("stlResults").style.display = "block";

  localStorage.setItem("stlVolume", volume);
  localStorage.setItem("stlWeight", weight);
}

function readVertex(dv, o) {
  return {
    x: dv.getFloat32(o, true),
    y: dv.getFloat32(o + 4, true),
    z: dv.getFloat32(o + 8, true)
  };
}

function signedVolume(a, b, c) {
  return (
    a.x * b.y * c.z +
    b.x * c.y * a.z +
    c.x * a.y * b.z -
    a.x * c.y * b.z -
    b.x * a.y * c.z -
    c.x * b.y * a.z
  ) / 6;
}

function sendToCalculator() {
  window.location.href = "calculator.html";
}
