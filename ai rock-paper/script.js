// Path to your exported Teachable Machine model folder
const MODEL_URL = "./model/";

let model, webcam, labelContainer, maxPredictions;

const startBtn = document.getElementById("start-btn");
const banner = document.getElementById("prediction-banner");

startBtn.addEventListener("click", init);

async function init() {
  startBtn.disabled = true;
  startBtn.textContent = "Loading Model...";

  try {
    const modelURL = MODEL_URL + "model.json";
    const metadataURL = MODEL_URL + "metadata.json";

    // Load the model and metadata
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Set up webcam (width, height, flip horizontally)
    const flip = true;
    webcam = new tmImage.Webcam(260, 260, flip);
    await webcam.setup();
    await webcam.play();

    document.getElementById("webcam-container").appendChild(webcam.canvas);
    buildPredictionBars();

    startBtn.textContent = "Camera Active";
    window.requestAnimationFrame(loop);
  } catch (error) {
    console.error("Failed to initialize model or webcam:", error);
    banner.textContent = "Error: Check console & camera permissions.";
    startBtn.disabled = false;
    startBtn.textContent = "Retry";
  }
}

function buildPredictionBars() {
  labelContainer = document.getElementById("label-container");
  labelContainer.innerHTML = "";

  for (let i = 0; i < maxPredictions; i++) {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <div class="bar-header">
        <span class="class-name">Class ${i}</span>
        <span class="class-prob">0%</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill"></div>
      </div>
    `;
    labelContainer.appendChild(row);
  }
}

async function loop() {
  webcam.update();
  await predict();
  window.requestAnimationFrame(loop);
}

async function predict() {
  const predictions = await model.predict(webcam.canvas);

  let topClass = "";
  let topProb = 0;

  for (let i = 0; i < maxPredictions; i++) {
    const { className, probability } = predictions[i];
    const percent = Math.round(probability * 100);

    // Update UI bars
    const row = labelContainer.children[i];
    row.querySelector(".class-name").textContent = className;
    row.querySelector(".class-prob").textContent = `${percent}\%`; row.querySelector(".bar-fill").style.width = `${percent}%`;

    if (probability > topProb) {
      topProb = probability;
      topClass = className;
    }
  }

  // Only show a confident prediction (above 80%)
  if (topProb > 0.8) {
    banner.textContent = `Detected: ${topClass} (${Math.round(topProb * 100)}%)`;
  } else {
    banner.textContent = "Hold gesture steady...";
  }
}