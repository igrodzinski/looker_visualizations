looker.plugins.visualizations.add({
  id: "table_v1",
  label: "table_v1",
  options: {
    // Tutaj musisz ręcznie zdefiniować każdą opcję, np. kolor nagłówka
    header_color: {
      type: "string",
      label: "Kolor nagłówka",
      display: "color",
      default: "#c0c0c0"
    }
  },

  create: function(element, config) {
    element.innerHTML = `
      <style>
        .my-table { width: 100%; border-collapse: collapse; font-family: Arial; }
        .my-table th, .my-table td { border: 1px solid #ddd; padding: 8px; }
        .my-table th { background-color: #f2f2f2; }
      </style>
      <div id="table-container"></div>
    `;
    this._container = element.querySelector("#table-container");
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();
    if (data.length == 0) {
      this.addError({title: "Brak danych", message: "Brak wyników."});
      return;
    }

    // 1. Pobranie nagłówków (wymiary i miary)
    const dimensions = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;
    const allFields = [...dimensions, ...measures];

    // 2. Budowanie HTML tabeli
    let html = '<table class="my-table"><thead><tr>';

    // Generowanie nagłówków
    allFields.forEach(field => {
      // Użycie opcji koloru z konfiguracji
      const colorStyle = config.header_color ? `style="background-color:${config.header_color}"` : "";
      html += `<th ${colorStyle}>${field.label_short || field.label}</th>`;
    });
    html += '</tr></thead><tbody>';

    // Generowanie wierszy
    data.forEach(row => {
      html += '<tr>';
      allFields.forEach(field => {
        const cell = row[field.name];
        // Użycie funkcji Lookera do formatowania wartości (np. waluty)
        const renderedValue = LookerCharts.Utils.htmlForCell(cell);
        html += `<td>${renderedValue}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table>';

    // 3. Wstawienie tabeli do kontenera
    this._container.innerHTML = html;
    
    done();
  }
});
