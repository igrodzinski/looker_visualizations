looker.plugins.visualizations.add({
  id: "custom_styled_table",
  label: "Konfigurowalna Tabela",
  
  // Opcje globalne (statyczne)
  options: {
    globalBorderColor: {
      type: "string",
      label: "Kolor obramowania tabeli",
      display: "color",
      default: "#e6e6e6"
    },
    globalFontFamily: {
      type: "string",
      label: "Czcionka globalna",
      display: "select",
      values: [{"Arial": "Arial"}, {"Roboto": "Roboto"}, {"Times New Roman": "Times"}],
      default: "Arial"
    }
  },

 create: function(element, config) {
    // Dodanie stylów CSS dla struktury tabeli (np. border-collapse)
    element.innerHTML = `
      <style>
        .custom-looker-table { width: 100%; border-collapse: collapse; }
        .custom-looker-table th, .custom-looker-table td { text-align: left; }
      </style>
      <div id="vis-container" style="height: 100%; overflow: auto;"></div>
    `;
    this._container = element.querySelector('#vis-container');
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    // 1. DYNAMICZNE OPCJE DLA KOLUMN
    // Pobieramy wszystkie wymiary (dimensions) i miary (measures) z zapytania
    const fields = queryResponse.fields.dimension_like.concat(queryResponse.fields.measure_like);
    let dynamicOptions = { ...this.options };

    fields.forEach(field => {
      const fieldName = field.name;
      const fieldLabel = field.label_short || field.label;

      // Tworzymy zestaw opcji dla KAŻDEJ kolumny
      dynamicOptions[`${fieldName}_color`] = {
        section: `Kolumna: ${fieldLabel}`, // Grupuje opcje w sekcje w panelu Lookera
        type: "string",
        display: "color",
        label: "Kolor tekstu",
        default: "#333333"
      };
      
      dynamicOptions[`${fieldName}_fontSize`] = {
        section: `Kolumna: ${fieldLabel}`,
        type: "string",
        label: "Wielkość czcionki (np. 14px)",
        default: "12px"
      };

      dynamicOptions[`${fieldName}_padding`] = {
        section: `Kolumna: ${fieldLabel}`,
        type: "string",
        label: "Padding (np. 10px 5px)",
        default: "8px"
      };

      dynamicOptions[`${fieldName}_fontWeight`] = {
        section: `Kolumna: ${fieldLabel}`,
        type: "string",
        display: "select",
        label: "Grubość (Bold)",
        values: [{"Normalny": "normal"}, {"Pogrubiony": "bold"}],
        default: "normal"
      };
    });

    // Rejestrujemy nowe, dynamiczne opcje w Lookerze
    this.trigger('registerOptions', dynamicOptions);

    // 2. RYSOWANIE TABELI
    // Rozpoczynamy budowę HTML w oparciu o wybrane opcje konfiguracyjne (config)
    let html = `<table class="custom-looker-table" style="border: 1px solid ${config.globalBorderColor}; font-family: ${config.globalFontFamily}">`;
    
    // Nagłówki
    html += "<thead><tr>";
    fields.forEach(field => {
      // Dla nagłówków można użyć globalnych stylów lub stworzyć osobną sekcję opcji
      html += `<th style="border-bottom: 2px solid ${config.globalBorderColor}; padding: 10px;">${field.label_short}</th>`;
    });
    html += "</tr></thead><tbody>";

    // Wiersze z danymi
    data.forEach(row => {
      html += "<tr>";
      fields.forEach(field => {
        const fieldName = field.name;
        // Odczytanie wartości dla konkretnej komórki
        const cellValue = LookerCharts.Utils.htmlForCell(row[fieldName]) || row[fieldName].value;
        
        // Zastosowanie dynamicznych stylów z obiektu 'config' dla tej konkretnej kolumny
        const cellColor = config[`${fieldName}_color`] || "#333333";
        const cellFontSize = config[`${fieldName}_fontSize`] || "12px";
        const cellPadding = config[`${fieldName}_padding`] || "8px";
        const cellFontWeight = config[`${fieldName}_fontWeight`] || "normal";

        html += `
          <td style="
            color: ${cellColor}; 
            font-size: ${cellFontSize}; 
            padding: ${cellPadding}; 
            font-weight: ${cellFontWeight};
            border-bottom: 1px solid ${config.globalBorderColor};
          ">
            ${cellValue}
          </td>
        `;
      });
      html += "</tr>";
    });

    html += "</tbody></table>";

    // Aktualizacja DOM
    this._container.innerHTML = html;

    // Zgłoszenie do Lookera, że renderowanie zakończone
    done();
  }
});
