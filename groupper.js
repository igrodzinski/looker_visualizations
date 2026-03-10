looker.viz.register({
  options: {
    // Tutaj możesz dodać opcje konfiguracji kolorów itp.
  },

  create: function(element, config) {
    element.innerHTML = `
      <style>
        .contract-group { margin-bottom: 20px; font-family: sans-serif; }
        .contract-header { font-weight: bold; font-size: 1.2em; margin-bottom: 5px; background: #f4f4f4; padding: 5px; }
        .contract-table { width: 100%; border-collapse: collapse; }
        .contract-table td { border: 1px solid #ccc; padding: 4px 8px; }
      </style>
      <div id="container"></div>`;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const container = element.querySelector("#container");
    container.innerHTML = '';

    if (!data.length) return done();

    const dims = queryResponse.fields.dimension_like;
    const measures = queryResponse.fields.measure_like;
    
    // Grupowanie danych po pierwszej kolumnie (nr_umowy)
    const grouped = data.reduce((acc, row) => {
      const key = row[dims[0].name].value;
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});

    // Renderowanie sekcji
    for (const [nr_umowy, rows] of Object.entries(grouped)) {
      const groupDiv = document.createElement("div");
      groupDiv.className = "contract-group";
      
      let tableHtml = `<div class="contract-header">${nr_umowy}</div>`;
      tableHtml += `<table class="contract-table">`;
      
      rows.forEach(row => {
        tableHtml += `<tr>`;
        // Pomijamy pierwszą kolumnę (klucz grupowania) i iterujemy po reszcie
        [...dims.slice(1), ...measures].forEach(field => {
          tableHtml += `<td>${LookerCharts.Utils.htmlForCell(row[field.name])}</td>`;
        });
        tableHtml += `</tr>`;
      });

      tableHtml += `</table>`;
      groupDiv.innerHTML = tableHtml;
      container.appendChild(groupDiv);
    }

    done();
  }
});
