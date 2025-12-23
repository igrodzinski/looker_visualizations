looker.plugins.visualizations.add({
  id: "themed_table",
  label: "Tabela z Motywami",
  
  // 1. Definicja opcji wyboru motywu
  options: {
    table_theme: {
      type: "string",
      label: "Motyw",
      display: "select",
      values: [
        {"Klasyczny": "theme-classic"},
        {"Ciemny": "theme-dark"},
        {"Minimalistyczny": "theme-minimal"}
      ],
      default: "theme-classic"
    }
  },

  create: function(element, config) {
    // 2. Definicja stylów CSS dla każdego motywu
    element.innerHTML = `
      <style>
        /* Baza */
        .my-table { width: 100%; border-collapse: collapse; font-family: sans-serif; }
        .my-table td, .my-table th { padding: 10px; }

        /* Motyw: Klasyczny (theme-classic) */
        .theme-classic th { background-color: #f0f0f0; border-bottom: 2px solid #ccc; color: #333; }
        .theme-classic td { border-bottom: 1px solid #ddd; color: #333; }
        
        /* Motyw: Ciemny (theme-dark) */
        .theme-dark { background-color: #222; color: #fff; }
        .theme-dark th { background-color: #444; border-bottom: 1px solid #666; }
        .theme-dark td { border-bottom: 1px solid #555; }

        /* Motyw: Minimalistyczny (theme-minimal) */
        .theme-minimal th { border-bottom: 1px solid #000; text-align: left; font-weight: bold; }
        .theme-minimal td { border: none; }
      </style>
      <div id="table-container"></div>
    `;
    this._container = element.querySelector("#table-container");
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    // Pobranie wybranego motywu (klasy CSS)
    const themeClass = config.table_theme || "theme-classic";

    // Budowanie tabeli HTML
    let html = `<table class="my-table ${themeClass}"><thead><tr>`;
    
    // ... (kod generowania nagłówków i wierszy jak w poprzednim przykładzie) ...
    
    // (Skrócony przykład dla czytelności)
    queryResponse.fields.dimensions.forEach(field => {
       html += `<th>${field.label_short}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    data.forEach(row => {
       html += '<tr>';
       queryResponse.fields.dimensions.forEach(field => {
         html += `<td>${LookerCharts.Utils.htmlForCell(row[field.name])}</td>`;
       });
       html += '</tr>';
    });
    html += '</tbody></table>';

    this._container.innerHTML = html;
    done();
  }
});
