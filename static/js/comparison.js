/**
 * comparison.js — Algorithm Comparison Page
 * Runs /api/compare and renders:
 * - Performance table
 * - Charts
 * - Routes found
 * - Measured observation
 */

'use strict';


// ========================================================
// CHART REFERENCES
// ========================================================

let chartNodes = null;
let chartTime = null;
let chartDist = null;


// ========================================================
// ALGORITHM ORDER
// ========================================================

const ALGORITHM_ORDER = [
  'A*',
  'BFS',
  'Dijkstra',
  'Greedy'
];


// ========================================================
// ALGORITHM DISPLAY INFORMATION
// ========================================================

const ALGORITHM_META = {

  'A*': {
    label: 'A*',
    icon: '⭐',
    badge: 'badge-astar'
  },

  'BFS': {
    label: 'BFS',
    icon: '🔍',
    badge: 'badge-bfs'
  },

  'Dijkstra': {
    label: 'Dijkstra',
    icon: '📐',
    badge: 'badge-dijkstra'
  },

  'Greedy': {
    label: 'Greedy',
    icon: '🎯',
    badge: 'badge-greedy'
  },

  /*
   * Some older backend versions may return
   * "Greedy Best-First".
   *
   * We still display it simply as "Greedy".
   */
  'Greedy Best-First': {
    label: 'Greedy',
    icon: '🎯',
    badge: 'badge-greedy'
  }

};


// ========================================================
// FIND ALGORITHM KEY
// ========================================================

function getAlgorithmKey(results, requestedKey) {

  /*
   * Handle both possible Greedy names.
   */
  if (requestedKey === 'Greedy') {

    if (results['Greedy']) {
      return 'Greedy';
    }

    if (results['Greedy Best-First']) {
      return 'Greedy Best-First';
    }

  }


  /*
   * Normal algorithms.
   */
  if (results[requestedKey]) {
    return requestedKey;
  }


  return null;

}


// ========================================================
// GET ALGORITHMS IN FIXED ORDER
// ========================================================

function getOrderedAlgorithms(results) {

  return ALGORITHM_ORDER
    .map(name => getAlgorithmKey(results, name))
    .filter(Boolean);

}


// ========================================================
// GET DISPLAY INFORMATION
// ========================================================

function getMeta(algo) {

  return ALGORITHM_META[algo] || {

    label: algo,
    icon: '🔧',
    badge: ''

  };

}


// ========================================================
// RUN COMPARISON
// ========================================================

async function runComparison() {

  const start =
    document.getElementById('cmpStart').value;

  const goal =
    document.getElementById('cmpGoal').value;


  // ------------------------------------------------------
  // VALIDATION
  // ------------------------------------------------------

  if (!start || !goal) {

    alert(
      'Please select both start and destination.'
    );

    return;

  }


  if (start === goal) {

    alert(
      'Start and destination cannot be the same.'
    );

    return;

  }


  // ------------------------------------------------------
  // BUTTON
  // ------------------------------------------------------

  const btn =
    document.getElementById('runCmpBtn');


  btn.disabled = true;

  btn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span> Running…';


  // ------------------------------------------------------
  // SHOW LOADING
  // ------------------------------------------------------

  document.getElementById(
    'cmpLoading'
  ).style.display = 'block';


  document.getElementById(
    'cmpResults'
  ).style.display = 'none';


  // ------------------------------------------------------
  // API REQUEST
  // ------------------------------------------------------

  try {

    const results =
      await apiPost(
        '/api/compare',
        {
          start: start,
          goal: goal
        }
      );


    renderComparison(results);


    document.getElementById(
      'cmpResults'
    ).style.display = 'block';


  }

  catch (err) {

    alert(
      'Error: ' +
      (err.message || 'Unable to run comparison.')
    );

  }

  finally {

    btn.disabled = false;

    btn.innerHTML =
      '<i class="bi bi-play-fill me-2"></i> Run Comparison';


    document.getElementById(
      'cmpLoading'
    ).style.display = 'none';

  }

}


// ========================================================
// RENDER EVERYTHING
// ========================================================

function renderComparison(results) {

  const keys =
    getOrderedAlgorithms(results);


  if (!keys.length) {

    document.getElementById(
      'cmpTableBody'
    ).innerHTML = `
      <tr>
        <td
          colspan="6"
          class="text-center"
        >
          No comparison results available.
        </td>
      </tr>
    `;

    return;

  }


  renderTable(
    results,
    keys
  );


  renderCharts(
    results,
    keys
  );


  renderPaths(
    results,
    keys
  );


  renderObservation(
    results,
    keys
  );

}


// ========================================================
// PERFORMANCE TABLE
// ========================================================

function renderTable(
  results,
  keys
) {

  const tbody =
    document.getElementById(
      'cmpTableBody'
    );


  tbody.innerHTML = '';


  keys.forEach(algo => {

    const r =
      results[algo];

    const meta =
      getMeta(algo);


    const tr =
      document.createElement('tr');


    /*
     * Highlight algorithms that are marked optimal.
     */
    if (r.is_optimal) {

      tr.className =
        'optimal-row';

    }


    tr.innerHTML = `

      <td>

        <span class="algo-badge ${meta.badge}">

          ${meta.icon}

          ${meta.label}

        </span>

      </td>


      <td>

        ${
          r.found
            ? r.nodes_explored
            : '—'
        }

      </td>


      <td>

        ${
          r.found
            ? r.execution_time_ms + ' ms'
            : '—'
        }

      </td>


      <td>

        ${
          r.found

            ? r.total_distance_km + ' km'

            : '<span class="comparison-no-path">No path</span>'
        }

      </td>


      <td>

        ${
          r.found
            ? formatMinutes(r.total_time_min)
            : '—'
        }

      </td>


      <td>

        ${
          r.is_optimal

            ? `
              <span class="comparison-optimal">
                ✅ Optimal
              </span>
            `

            : r.found

              ? `
                <span class="comparison-suboptimal">
                  Sub-optimal
                </span>
              `

              : `
                <span class="comparison-no-path">
                  No path
                </span>
              `
        }

      </td>

    `;


    tbody.appendChild(tr);

  });

}


// ========================================================
// CHARTS
// ========================================================

function renderCharts(
  results,
  keys
) {

  const labels =
    keys.map(
      algo => getMeta(algo).label
    );


  /*
   * Chart colors.
   */
  const colors = [

    'rgba(0,212,170,0.70)',

    'rgba(255,193,7,0.70)',

    'rgba(108,99,255,0.70)',

    'rgba(255,107,107,0.70)'

  ];


  const borderColors = [

    '#00d4aa',

    '#ffc107',

    '#8c85ff',

    '#ff6b6b'

  ];


  /*
   * Nodes explored.
   */
  const nodesData =
    keys.map(algo => {

      return results[algo].found
        ? results[algo].nodes_explored
        : 0;

    });


  /*
   * Execution time.
   */
  const timeData =
    keys.map(algo => {

      return results[algo].found
        ? results[algo].execution_time_ms
        : 0;

    });


  /*
   * Route distance.
   */
  const distData =
    keys.map(algo => {

      return results[algo].found
        ? results[algo].total_distance_km
        : 0;

    });


  chartNodes =
    buildChart(
      'chartNodes',
      chartNodes,
      labels,
      nodesData,
      colors,
      borderColors,
      'nodes'
    );


  chartTime =
    buildChart(
      'chartTime',
      chartTime,
      labels,
      timeData,
      colors,
      borderColors,
      'ms'
    );


  chartDist =
    buildChart(
      'chartDist',
      chartDist,
      labels,
      distData,
      colors,
      borderColors,
      'km'
    );

}


// ========================================================
// ROUTE PATH CARDS
// ========================================================

function renderPaths(
  results,
  keys
) {

  const pathCards =
    document.getElementById(
      'pathCards'
    );


  pathCards.innerHTML = '';


  keys.forEach(algo => {

    const r =
      results[algo];


    /*
     * Skip algorithms without a route.
     */
    if (!r.found) {
      return;
    }


    const meta =
      getMeta(algo);


    const col =
      document.createElement('div');


    col.className =
      'col-lg-6';


    col.innerHTML = `

      <div class="comparison-path-card">


        <div class="comparison-path-header">


          <span
            class="algo-badge ${meta.badge}"
          >

            ${meta.icon}

            ${meta.label}

          </span>


          <span class="comparison-path-meta">

            ${r.path.length} nodes

            ·

            ${r.total_distance_km} km

          </span>


        </div>


        <div class="comparison-path">

          ${r.path_names.join(' → ')}

        </div>


      </div>

    `;


    pathCards.appendChild(col);

  });

}


// ========================================================
// OBSERVATION
// ========================================================

function renderObservation(
  results,
  keys
) {

  const recommendationText =
    document.getElementById(
      'recommendationText'
    );


  const astarKey =
    getAlgorithmKey(
      results,
      'A*'
    );


  const dijkstraKey =
    getAlgorithmKey(
      results,
      'Dijkstra'
    );


  const astar =
    astarKey
      ? results[astarKey]
      : null;


  const dijkstra =
    dijkstraKey
      ? results[dijkstraKey]
      : null;


  /*
   * If A* did not produce a route,
   * provide a neutral observation.
   */
  if (!astar || !astar.found) {

    recommendationText.innerHTML = `

      <strong>
        Comparison complete.
      </strong>

      A* did not find a route for this input.

    `;

    return;

  }


  /*
   * Start with measured A* results.
   */
  let message = `

    <div>

      <strong>
        ⭐ A* result for this route
      </strong>

      <br>

      A* explored

      <strong>
        ${astar.nodes_explored}
      </strong>

      nodes,

      completed in

      <strong>
        ${astar.execution_time_ms} ms
      </strong>

      and returned a

      <strong>
        ${astar.is_optimal ? 'optimal' : 'found'}
      </strong>

      route of

      <strong>
        ${astar.total_distance_km} km
      </strong>.

  `;


  /*
   * Only state that A* was faster than
   * Dijkstra when the measured values
   * actually show this.
   */
  if (

    dijkstra &&

    dijkstra.found &&

    Number(
      astar.execution_time_ms
    ) < Number(
      dijkstra.execution_time_ms
    )

  ) {

    message += `

      In this run, A* also completed faster
      than Dijkstra.

    `;

  }


  message += `
    </div>
  `;


  recommendationText.innerHTML =
    message;

}


// ========================================================
// BUILD CHART
// ========================================================

function buildChart(
  canvasId,
  chartRef,
  labels,
  data,
  bgColors,
  borderColors,
  unit
) {

  const canvas =
    document.getElementById(
      canvasId
    );


  if (!canvas) {

    return chartRef;

  }


  /*
   * Destroy old chart before creating
   * a new one.
   */
  if (chartRef) {

    chartRef.destroy();

  }


  const ctx =
    canvas.getContext('2d');


  return new Chart(
    ctx,
    {

      type: 'bar',


      data: {

        labels: labels,


        datasets: [

          {

            data: data,

            backgroundColor:
              bgColors,

            borderColor:
              borderColors,

            borderWidth: 2,

            borderRadius: 6

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

              label: function(ctx) {

                return (
                  ctx.raw +
                  ' ' +
                  unit
                );

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