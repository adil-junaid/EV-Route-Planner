/**
 * analytics.js — Analytics Page
 * Runs all four optimization modes and renders
 * live comparison charts + results table.
 */

'use strict';


// ========================================================
// MODE CONFIGURATION
// ========================================================

const MODE_COLORS = {
  fastest: '#00d4aa',
  cheapest: '#ffc107',
  eco: '#4caf70',
  balanced: '#8c85ff'
};

const MODE_LABELS = {
  fastest: '⚡ Fastest',
  cheapest: '💰 Cheapest',
  eco: '🌿 Eco',
  balanced: '⚖️ Balanced'
};


// ========================================================
// CHART STORAGE
// ========================================================

const modeCharts = {};


// ========================================================
// RUN ANALYTICS
// ========================================================

async function runAnalytics() {

  const startElement =
    document.getElementById('analStart');

  const goalElement =
    document.getElementById('analGoal');

  const batteryElement =
    document.getElementById('analBattery');

  if (!startElement || !goalElement || !batteryElement) {
    return;
  }

  const start = startElement.value;
  const goal = goalElement.value;

  const battPct =
    parseFloat(batteryElement.value) || 80;


  // ------------------------------------------------------
  // Validation
  // ------------------------------------------------------

  if (!start || !goal) {
    alert('Please select both start and destination.');
    return;
  }

  if (start === goal) {
    alert('Start and destination must differ.');
    return;
  }

  if (battPct < 20 || battPct > 100) {
    alert('Battery percentage must be between 20% and 100%.');
    return;
  }


  // ------------------------------------------------------
  // UI elements
  // ------------------------------------------------------

  const btn =
    document.getElementById('analRunBtn');

  const loading =
    document.getElementById('analLoading');

  const charts =
    document.getElementById('analCharts');


  if (btn) {
    btn.disabled = true;

    btn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span> Running…';
  }

  if (loading) {
    loading.style.display = 'block';
  }

  if (charts) {
    charts.style.display = 'none';
  }


  // ------------------------------------------------------
  // Optimization modes
  // ------------------------------------------------------

  const modes = [
    'fastest',
    'cheapest',
    'eco',
    'balanced'
  ];

  const results = {};


  try {

    // Run all four modes in parallel
    const promises = modes.map(mode =>

      apiPost('/api/route', {

        start: start,
        goal: goal,

        battery_capacity: 60,
        battery_pct: battPct,

        efficiency: 6.0,

        max_charge_power: 150,

        min_reserve: 10,

        mode: mode

      }).catch(error => ({

        found: false,
        error: error.message,
        mode: mode

      }))

    );


    const allResults =
      await Promise.all(promises);


    modes.forEach((mode, index) => {

      results[mode] =
        allResults[index];

    });


    // ----------------------------------------------------
    // Render results
    // ----------------------------------------------------

    renderAnalyticsCharts(results);


    if (charts) {
      charts.style.display = 'block';
    }


  } catch (error) {

    console.error(
      'Analytics error:',
      error
    );

    alert(
      'Unable to run analytics: ' +
      error.message
    );


  } finally {

    if (btn) {

      btn.disabled = false;

      btn.innerHTML =
        '<i class="bi bi-bar-chart-fill me-2"></i> Compare Modes';

    }

    if (loading) {
      loading.style.display = 'none';
    }

  }

}


// ========================================================
// RENDER ANALYTICS
// ========================================================

function renderAnalyticsCharts(results) {

  const modes = [
    'fastest',
    'cheapest',
    'eco',
    'balanced'
  ];


  const labels =
    modes.map(mode => MODE_LABELS[mode]);

  const colors =
    modes.map(mode => MODE_COLORS[mode]);


  // ------------------------------------------------------
  // Safely get values
  // ------------------------------------------------------

  const getValue =
    (mode, key, fallback = 0) => {

      const result =
        results[mode];

      if (!result || !result.found) {
        return fallback;
      }

      return result[key] ?? fallback;

    };


  // ------------------------------------------------------
  // Chart data
  // ------------------------------------------------------

  const journeyTimes =
    modes.map(mode =>
      getValue(
        mode,
        'total_journey_time_min'
      )
    );


  const costs =
    modes.map(mode =>
      getValue(
        mode,
        'total_charge_cost_inr'
      )
    );


  const energies =
    modes.map(mode =>
      getValue(
        mode,
        'total_energy_kwh'
      )
    );


  const stops =
    modes.map(mode => {

      const result =
        results[mode];

      if (!result || !result.found) {
        return 0;
      }

      return Array.isArray(result.charging_stops)
        ? result.charging_stops.length
        : 0;

    });


  // ------------------------------------------------------
  // Create bar chart
  // ------------------------------------------------------

  function buildBarChart(
    canvasId,
    data,
    unit
  ) {

    const canvas =
      document.getElementById(canvasId);

    if (!canvas) {
      return;
    }


    // Destroy previous chart
    if (modeCharts[canvasId]) {

      modeCharts[canvasId].destroy();

      modeCharts[canvasId] = null;

    }


    modeCharts[canvasId] =
      new Chart(
        canvas.getContext('2d'),
        {

          type: 'bar',

          data: {

            labels: labels,

            datasets: [

              {

                data: data,

                backgroundColor:
                  colors.map(
                    color => color + '99'
                  ),

                borderColor:
                  colors,

                borderWidth: 2,

                borderRadius: 8

              }

            ]

          },


          options: {

            responsive: true,

            maintainAspectRatio: false,


            plugins: {

              legend: {
                display: false
              },

              tooltip: {

                callbacks: {

                  label: context => {

                    return `${context.raw} ${unit}`;

                  }

                }

              }

            },


            scales: {

              y: {

                beginAtZero: true,

                grid: {

                  color:
                    'rgba(255,255,255,0.06)'

                },

                ticks: {

                  color:
                    '#8b95a6'

                }

              },


              x: {

                grid: {
                  display: false
                },

                ticks: {

                  color:
                    '#8b95a6'

                }

              }

            }

          }

        }

      );

  }


  // ------------------------------------------------------
  // Render four charts
  // ------------------------------------------------------

  buildBarChart(
    'chartJourneyTime',
    journeyTimes,
    'min'
  );


  buildBarChart(
    'chartCost',
    costs,
    '₹'
  );


  buildBarChart(
    'chartEnergy',
    energies,
    'kWh'
  );


  buildBarChart(
    'chartStops',
    stops,
    'stops'
  );


  // ------------------------------------------------------
  // Render results table
  // ------------------------------------------------------

  renderAnalyticsTable(
    modes,
    results
  );

}


// ========================================================
// RESULTS TABLE
// ========================================================

function renderAnalyticsTable(
  modes,
  results
) {

  const tbody =
    document.getElementById(
      'analTableBody'
    );

  if (!tbody) {
    return;
  }


  tbody.innerHTML = '';


  modes.forEach(mode => {

    const result =
      results[mode];

    const found =
      result &&
      result.found;


    const row =
      document.createElement('tr');


    // ----------------------------------------------------
    // Mode
    // ----------------------------------------------------

    const modeCell =
      document.createElement('td');

    modeCell.style.color =
      MODE_COLORS[mode];

    modeCell.style.fontWeight =
      '700';

    modeCell.textContent =
      MODE_LABELS[mode];


    // ----------------------------------------------------
    // Total time
    // ----------------------------------------------------

    const totalTimeCell =
      document.createElement('td');

    totalTimeCell.textContent =
      found
        ? formatMinutes(
            result.total_journey_time_min
          )
        : '—';


    // ----------------------------------------------------
    // Drive time
    // ----------------------------------------------------

    const driveTimeCell =
      document.createElement('td');

    driveTimeCell.textContent =
      found
        ? formatMinutes(
            result.total_travel_time_min
          )
        : '—';


    // ----------------------------------------------------
    // Charge time
    // ----------------------------------------------------

    const chargeTimeCell =
      document.createElement('td');

    chargeTimeCell.textContent =
      found
        ? formatMinutes(
            result.total_charge_time_min
          )
        : '—';


    // ----------------------------------------------------
    // Energy
    // ----------------------------------------------------

    const energyCell =
      document.createElement('td');

    energyCell.textContent =
      found
        ? `${Number(
            result.total_energy_kwh || 0
          ).toFixed(1)}`
        : '—';


    // ----------------------------------------------------
    // Cost
    // ----------------------------------------------------

    const costCell =
      document.createElement('td');

    costCell.textContent =
      found
        ? `₹${Number(
            result.total_charge_cost_inr || 0
          ).toFixed(0)}`
        : '—';


    // ----------------------------------------------------
    // Charging stops
    // ----------------------------------------------------

    const stopsCell =
      document.createElement('td');

    stopsCell.textContent =
      found
        ? (
            Array.isArray(
              result.charging_stops
            )
              ? result.charging_stops.length
              : 0
          )
        : '—';


    // ----------------------------------------------------
    // Distance
    // ----------------------------------------------------

    const distanceCell =
      document.createElement('td');

    distanceCell.textContent =
      found
        ? `${result.total_distance_km} km`
        : '—';


    // ----------------------------------------------------
    // Add cells
    // ----------------------------------------------------

    row.appendChild(modeCell);
    row.appendChild(totalTimeCell);
    row.appendChild(driveTimeCell);
    row.appendChild(chargeTimeCell);
    row.appendChild(energyCell);
    row.appendChild(costCell);
    row.appendChild(stopsCell);
    row.appendChild(distanceCell);


    tbody.appendChild(row);

  });

}