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
    5000
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(viewer.clientWidth, viewer.clientHeight);
  viewer.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const light = new THREE.DirectionalLight(0xffffff, 0.8);
  light.position.set(100, 100, 100);
  scene.add(light);

  const grid = new THREE.GridHelper(200, 20, 0x444444, 0x222222);
  scene.add(grid);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  document.getElementById("stlStatus").textContent = file.name;

  const reader = new FileReader();
  reader.onload = ev => {
    loadSTL(ev.target.result);
    calculateVolume(ev.target.result);
  };
  reader.readAsArrayBuffer(file);
}

function loadSTL(buffer) {
  const loader = new THREE.STLLoader();
  const geometry = loader.parse(buffer);

  if (mesh) scene.remove(mesh);

  geometry.center();
  geometry.computeVertexNormals();

  mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0x00c8ff,
      metalness: 0.2,
      roughness: 0.5
    })
  );

  scene.add(mesh);

  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const dist = Math.max(size.x, size.y, size.z) * 1.5;

  camera.position.set(dist, dist, dist);
  camera.lookAt(box.getCenter(new THREE.Vector3()));
  controls.target.copy(box.getCenter(new THREE.Vector3()));
}

function calculateVolume(buffer) {
  const dv = new DataView(buffer);
  const tris = (dv.byteLength - 84) / 50;
  let vol = 0;

  for (let i = 0; i < tris; i++) {
    const o = 84 + i * 50 + 12;
    vol += signedVolume(
      readVertex(dv, o),
      readVertex(dv, o + 12),
      readVertex(dv, o + 24)
    );
  }

  vol = Math.abs(vol) / 1000;
  document.getElementById("volume").textContent = vol.toFixed(2);
  document.getElementById("weight").textContent = (vol * densityPLA).toFixed(1);
  document.getElementById("stlResults").style.display = "block";
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
