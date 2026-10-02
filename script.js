// ====================================================================
// SAMPLE BENCHMARK DATASET RECORDS
// ====================================================================
const sampleStudents = [
  { id: "STU-1001", attendance: 88, gpa: 3.4, failed: 0, tuition: "yes", scholarship: "yes", parentEdu: "bachelors", target: "Retained" },
  { id: "STU-1002", attendance: 52, gpa: 1.9, failed: 3, tuition: "no", scholarship: "no", parentEdu: "high_school", target: "Dropout" },
  { id: "STU-1003", attendance: 76, gpa: 2.8, failed: 1, tuition: "yes", scholarship: "no", parentEdu: "bachelors", target: "Retained" },
  { id: "STU-1004", attendance: 61, gpa: 2.1, failed: 2, tuition: "no", scholarship: "no", parentEdu: "high_school", target: "Dropout" },
  { id: "STU-1005", attendance: 92, gpa: 3.8, failed: 0, tuition: "yes", scholarship: "yes", parentEdu: "masters", target: "Retained" }
];

const BACKEND_URL = 'http://localhost:5000/predict';

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  
  document.getElementById('content-' + tabName).classList.remove('hidden');
  document.getElementById('tab-' + tabName).classList.add('active');
}

function initCharts() {
  const ctx = document.getElementById('chartFeatureImportance').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Attendance_Rate', 'GPA', 'CGPA', 'Assignment_Delay_Days', 'Stress_Index', 'Study_Hours_per_Day'],
      datasets: [{
        label: 'Gini Feature Importance',
        data: [0.32, 0.25, 0.18, 0.12, 0.08, 0.05],
        backgroundColor: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#c084fc', '#e879f9'],
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, max: 0.4, ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
        y: { ticks: { color: '#cbd5e1' }, grid: { display: false } }
      }
    }
  });
}

// ====================================================================
// REAL-TIME PREDICTION CALL TO FLASK
// ====================================================================
async function updatePrediction() {
  const attendance = parseFloat(document.getElementById('attendance').value);
  const gpa = parseFloat(document.getElementById('gpa').value);
  const failed = parseInt(document.getElementById('failed').value);
  const tuition = document.getElementById('tuition').value;
  const scholarship = document.getElementById('scholarship').value;
  const parentEdu = document.getElementById('parentEdu').value;

  document.getElementById('attendanceVal').innerText = attendance + '%';
  document.getElementById('gpaVal').innerText = gpa.toFixed(2);

  // Send payload matching 17 Colab model variables
  const payload = {
    age: 21,
    gender: 'female',
    family_income: 45000,
    internet: 'yes',
    study_hours: 4.0,
    attendance: attendance,
    assignment_delay: failed * 2,
    travel_time: 25,
    part_time: 'no',
    scholarship: scholarship,
    stress_index: attendance < 65 ? 8 : 3,
    gpa: gpa,
    semester_gpa: gpa,
    cgpa: gpa,
    semester: 3,
    department: 'computer_science',
    parentEdu: parentEdu
  };

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Backend server error");

    const result = await response.json();
    renderPredictionUI(result.is_dropout, result.confidence, result.rule_triggered, result.recommendation, result.source);

  } catch (error) {
    console.warn("⚠️ Flask backend offline. Running fallback client model.");
    let isDropout = (attendance < 70 && (gpa < 2.2 || failed >= 2));
    renderPredictionUI(isDropout, 85.0, `IF Attendance (${attendance}%) < 70%`, "Fallback result", "Client Simulation (Flask Offline)");
  }
}

function renderPredictionUI(isDropout, confidence, ruleText, recText, sourceTag) {
  const badge = document.getElementById('riskBadge');
  const icon = document.getElementById('riskIcon');
  const status = document.getElementById('riskStatus');
  const confEl = document.getElementById('riskConfidence');
  const ruleEl = document.getElementById('ruleTriggered');
  const recEl = document.getElementById('recommendationText');

  if (isDropout) {
    badge.className = "p-5 rounded-xl border text-center transition-all duration-300 bg-red-950/60 border-red-800/60 text-red-300";
    icon.className = "fa-solid fa-triangle-exclamation text-3xl text-red-400 mb-2";
    status.innerText = "HIGH DROPOUT RISK";
    confEl.className = "text-xs font-medium mt-1 text-red-400";
  } else {
    badge.className = "p-5 rounded-xl border text-center transition-all duration-300 bg-emerald-950/60 border-emerald-800/60 text-emerald-300";
    icon.className = "fa-solid fa-circle-check text-3xl text-emerald-400 mb-2";
    status.innerText = "LOW RISK (RETAINED)";
    confEl.className = "text-xs font-medium mt-1 text-emerald-400";
  }

  confEl.innerText = `Model Confidence: ${confidence}% [Source: ${sourceTag}]`;
  ruleEl.innerText = ruleText;
  recEl.innerText = recText;
}

function renderDatasetTable() {
  const tbody = document.getElementById('datasetTableBody');
  tbody.innerHTML = sampleStudents.map(student => `
    <tr class="hover:bg-slate-800/50 transition">
      <td class="p-3 font-mono font-medium text-slate-100">${student.id}</td>
      <td class="p-3">${student.attendance}%</td>
      <td class="p-3">${student.gpa.toFixed(2)}</td>
      <td class="p-3">${student.failed}</td>
      <td class="p-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${student.tuition === 'yes' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : 'bg-red-950/80 text-red-400 border border-red-800/60'}">
          ${student.tuition === 'yes' ? 'Paid' : 'Unpaid'}
        </span>
      </td>
      <td class="p-3">${student.scholarship === 'yes' ? 'Yes' : 'No'}</td>
      <td class="p-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${student.target === 'Retained' ? 'bg-blue-950/80 text-blue-400 border border-blue-800/60' : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'}">
          ${student.target}
        </span>
      </td>
      <td class="p-3 text-right">
        <button onclick="loadProfileIntoSimulator('${student.id}')" class="bg-blue-600 hover:bg-blue-500 text-white text-[11px] px-2.5 py-1 rounded-lg transition shadow-sm">
          Load Profile
        </button>
      </td>
    </tr>
  `).join('');
}

function loadProfileIntoSimulator(studentId) {
  const student = sampleStudents.find(s => s.id === studentId);
  if (!student) return;

  document.getElementById('attendance').value = student.attendance;
  document.getElementById('gpa').value = student.gpa;
  document.getElementById('failed').value = Math.min(3, student.failed);
  document.getElementById('tuition').value = student.tuition;
  document.getElementById('scholarship').value = student.scholarship;
  document.getElementById('parentEdu').value = student.parentEdu;

  updatePrediction();
  switchTab('simulator');
}

window.addEventListener('DOMContentLoaded', () => {
  initCharts();
  renderDatasetTable();
  updatePrediction();
});