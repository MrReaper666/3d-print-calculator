const densityPLA = 1.24; // g/cm³ (default PLA)

document.getElementById("stlFile").addEventListener("change", handleFile);

function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => parseSTL(e.target.result);
  reader.readAsArrayBuffer(file);
}

function parseSTL(buffer) {
  const dv = new DataView(buffer);
  let triangles = (dv.byteLength - 84) / 50;
  let volume = 0;

  for (let i = 0; i < triangles; i++) {
    const offset = 84 + i * 50 + 12;

    const v1 = readVertex(dv, offset);
    const v2 = readVertex(dv, offset + 12);
    const v3 = readVertex(dv, offset + 24);

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

function readVertex(dv, offset) {
  return {
    x: dv.getFloat32(offset, true),
    y: dv.getFloat32(offset + 4, true),
    z: dv.getFloat32(offset + 8, true)
  };
}

function signedVolume(p1, p2, p3) {
  return (
    p1.x * p2.y * p3.z +
    p2.x * p3.y * p1.z +
    p3.x * p1.y * p2.z -
    p1.x * p3.y * p2.z -
    p2.x * p1.y * p3.z -
    p3.x * p2.y * p1.z
  ) / 6;
}

function sendToCalculator() {
  window.location.href = "calculator.html";
}
