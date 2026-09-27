/**
 * planner.js — Route Planner Page
 * Handles EV summary updates, optimization mode selection,
 * and route submission.
 */

'use strict';


// ============================================================
// LIVE EV SUMMARY
// ============================================================

function updateEVSummary() {
  const capacity =
    parseFloat(document.getElementById('batteryCapacity').value) || 60;

  const pct =
    parseInt(document.getElementById('batteryPct').value) || 75;

  const efficiency =
    parseFloat(document.getElementById('efficiency').value) || 6.0;

  const reserve =
    parseInt(document.getElementById('minReserve').value) || 10;


  // Update displayed values
  document.getElementById('batteryPctDisplay').textContent = pct + '%';
  document.getElementById('reserveDisplay').textContent = reserve + '%';


  // Calculate energy
  const currentEnergy = capacity * (pct / 100);
  const reserveEnergy = capacity * (reserve / 100);

  const usableEnergy = Math.max(
    0,
    currentEnergy - reserveEnergy
  );

  const range = usableEnergy * efficiency;


  // Update summary
  document.getElementById('summaryRange').textContent =
    Math.round(range);

  document.getElementById('summaryEnergy').textContent =
    usableEnergy.toFixed(1);

  document.getElementById('summaryBattery').textContent =
    pct + '%';


  // Update battery bar
  const bar = document.getElementById('batteryBar');

  if (bar) {
    bar.style.width = pct + '%';

    if (pct >= 50) {
      bar.style.background =
        'linear-gradient(90deg,#00d4aa,#00f0c0)';
    } else if (pct >= 25) {
      bar.style.background =
        'linear-gradient(90deg,#ffc107,#ff9800)';
    } else {
      bar.style.background =
        'linear-gradient(90deg,#ff6b6b,#ff3b3b)';
    }
  }
}



// ============================================================
// OPTIMIZATION MODE
// ============================================================

function updateModeSelection() {

  document
    .querySelectorAll('label[for^="mode_"]')
    .forEach(label => {

      label.style.borderColor = 'var(--border)';
      label.style.color = 'var(--text-secondary)';
      label.style.background = 'var(--bg-input)';

    });


  const selectedMode =
    document.querySelector('input[name="mode"]:checked');


  if (!selectedMode) {
    return;
  }


  const selectedLabel =
    document.querySelector(
      `label[for="mode_${selectedMode.value}"]`
    );


  if (selectedLabel) {

    selectedLabel.style.borderColor =
      'var(--primary)';

    selectedLabel.style.color =
      'var(--primary)';

    selectedLabel.style.background =
      'rgba(0,212,170,0.08)';
  }
}



// ============================================================
// FORM SUBMISSION
// ============================================================

const routeForm = document.getElementById('routeForm');

if (routeForm) {

  routeForm.addEventListener(
    'submit',
    async function (e) {

      e.preventDefault();


      // Error elements
      const errorDiv =
        document.getElementById('formError');

      const errorMsg =
        document.getElementById('formErrorMsg');


      if (errorDiv) {
        errorDiv.classList.add('d-none');
      }


      // Get route locations
      const start =
        document.getElementById('startNode').value;

      const goal =
        document.getElementById('goalNode').value;


      // Validate start
      if (!start) {
        showError('Please select a start location.');
        return;
      }


      // Validate destination
      if (!goal) {
        showError('Please select a destination.');
        return;
      }


      // Prevent same location
      if (start === goal) {
        showError(
          'Start and destination cannot be the same city.'
        );
        return;
      }


      // Get selected optimization mode
      const selectedMode =
        document.querySelector(
          'input[name="mode"]:checked'
        );


      if (!selectedMode) {
        showError(
          'Please select an optimization mode.'
        );
        return;
      }


      // ========================================================
      // API PAYLOAD
      // ========================================================

      const payload = {

        start: start,

        goal: goal,

        battery_capacity:
          parseFloat(
            document.getElementById(
              'batteryCapacity'
            ).value
          ),

        battery_pct:
          parseInt(
            document.getElementById(
              'batteryPct'
            ).value
          ),

        efficiency:
          parseFloat(
            document.getElementById(
              'efficiency'
            ).value
          ),

        max_charge_power:
          parseFloat(
            document.getElementById(
              'maxChargePower'
            ).value
          ),

        min_reserve:
          parseInt(
            document.getElementById(
              'minReserve'
            ).value
          ),

        mode:
          selectedMode.value
      };


      // ========================================================
      // BUTTON LOADING STATE
      // ========================================================

      const btn =
        document.getElementById(
          'findRouteBtn'
        );


      if (btn) {

        btn.disabled = true;

        btn.innerHTML =
          '<span class="spinner-border spinner-border-sm me-2"></span> Calculating…';
      }


      // ========================================================
      // SEND REQUEST
      // ========================================================

      try {

        const result =
          await apiPost(
            '/api/route',
            payload
          );


        // Store result for results page
        sessionStorage.setItem(
          'routeResult',
          JSON.stringify(result)
        );


        // Navigate to results
        window.location.href =
          '/results';

      }

      catch (err) {

        showError(
          err.message ||
          'Unable to calculate the route.'
        );

      }

      finally {

        if (btn) {

          btn.disabled = false;

          btn.innerHTML =
            '<i class="bi bi-search me-2"></i> Find Optimal Route';
        }
      }


      // ========================================================
      // ERROR DISPLAY
      // ========================================================

      function showError(message) {

        if (!errorDiv || !errorMsg) {
          alert(message);
          return;
        }

        errorMsg.textContent = message;

        errorDiv.classList.remove('d-none');
      }

    }
  );
}



// ============================================================
// OPTIMIZATION MODE EVENTS
// ============================================================

document
  .querySelectorAll('input[name="mode"]')
  .forEach(radio => {

    radio.addEventListener(
      'change',
      updateModeSelection
    );

  });



// ============================================================
// EV INPUT EVENTS
// ============================================================

[
  'batteryPct',
  'minReserve',
  'batteryCapacity',
  'efficiency'
].forEach(id => {

  const element =
    document.getElementById(id);

  if (element) {

    element.addEventListener(
      'input',
      updateEVSummary
    );
  }

});



// ============================================================
// INITIALIZE PAGE
// ============================================================

document.addEventListener(
  'DOMContentLoaded',
  () => {

    // Initial EV summary
    updateEVSummary();

    // Highlight Balanced mode
    updateModeSelection();

  }
);