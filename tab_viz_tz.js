looker.plugins.visualizations.add({
  id: "custom_styled_table_advanced",
  label: "Zaawansowana Tabela",
  
  create: function(element, config) {
    element.innerHTML = `
      <style>
        .custom-looker-table { width: 100%; border-collapse: collapse; }
        .custom-looker-table th, .custom-looker-table td { text-align: left; border-bottom: 1px solid #ccc; }
      </style>
      <div id="vis-container" style="height: 100%; overflow: auto;"></div>
    `;
    this._container = element.querySelector('#vis-container');
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();
    const fields = queryResponse.fields.dimension_like.concat(queryResponse.fields.measure_like);

    // 1. DYNAMICZNE OPCJE
    let options = {
      // Warunkowe formatowanie wiersza (osobna sekcja na górze)
      row_cond_col: { section: "0. Formatowanie Wiersza", type: "string", display: "select", label: "Kolumna warunku", values: fields.map(f => { let o={}; o[f.label_short||f.label]=f.name; return o; }) },
      row_cond_val: { section: "0. Formatowanie Wiersza", type: "string", label: "Wartość warunku (dokładna)" },
      row_color: { section: "0. Formatowanie Wiersza", type: "string", display: "color", label: "Kolor tekstu wiersza" },
      row_weight: { section: "0. Formatowanie Wiersza", type: "string", display: "select", label: "Grubość wiersza", values: [{"Normalny": "normal"}, {"Pogrubiony": "bold"}] },
      row_size: { section: "0. Formatowanie Wiersza", type: "string", label: "Rozmiar czcionki (np. 14px)" }
    };

    // Generowanie zwijanych zakładek dla KAŻDEJ kolumny
    fields.forEach(f => {
      const fn = f.name;
      const sectionName = f.label_short || f.label; // To tworzy zakładkę jak na Twoim zdjęciu

      options[`${fn}_scope`] = { section: sectionName, type: "string", display: "select", label: "Zakres zmian", values: [{"Cała kolumna": "all"}, {"Konkretna wartość": "value"}], default: "all" };
      options[`${fn}_val`] = { section: sectionName, type: "string", label: "Podaj wartość (jeśli wybrano wyżej)" };
      options[`${fn}_color`] = { section: sectionName, type: "string", display: "color", label: "Kolor tekstu" };
      options[`${fn}_weight`] = { section: sectionName, type: "string", display: "select", label: "Grubość", values: [{"Normalny": "normal"}, {"Pogrubiony": "bold"}] };
      options[`${fn}_pad_type`] = { section: sectionName, type: "string", display: "select", label: "Typ paddingu", values: [{"Tylko lewy (padding-left)": "left"}, {"Wszędzie (padding)": "all"}], default: "left" };
      options[`${fn}_pad_val`] = { section: sectionName, type: "string", label: "Wartość paddingu (np. 10px)" };
    });

    this.trigger('registerOptions', options);

    // 2. RENDEROWANIE TABELI
    let html = `<table class="custom-looker-table"><thead><tr>`;
    fields.forEach(f => { html += `<th style="padding: 8px;">${f.label_short || f.label}</th>`; });
    html += "</tr></thead><tbody>";

    data.forEach(row => {
      // Warunek dla wiersza
      let isRowMatch = false;
      if (config.row_cond_col && config.row_cond_val !== undefined) {
        const checkVal = row[config.row_cond_col] ? String(row[config.row_cond_col].value) : "";
        if (checkVal === config.row_cond_val) isRowMatch = true;
      }

      const rColor = isRowMatch && config.row_color ? `color: ${config.row_color};` : "";
      const rWeight = isRowMatch && config.row_weight ? `font-weight: ${config.row_weight};` : "";
      const rSize = isRowMatch && config.row_size ? `font-size: ${config.row_size};` : "";

      html += `<tr style="${rColor} ${rWeight} ${rSize}">`;

      fields.forEach(field => {
        const fn = field.name;
        const cellData = row[fn];
        const rawValue = cellData ? String(cellData.value) : "";
        const displayValue = LookerCharts.Utils.htmlForCell(cellData) || rawValue;

        // Warunki dla komórki
        let applyColStyle = false;
        if (config[`${fn}_scope`] === 'all') applyColStyle = true;
        else if (config[`${fn}_scope`] === 'value' && rawValue === config[`${fn}_val`]) applyColStyle = true;

        let cStyles = "";
        if (applyColStyle) {
          if (config[`${fn}_color`]) cStyles += `color: ${config[`${fn}_color`]}; `;
          if (config[`${fn}_weight`]) cStyles += `font-weight: ${config[`${fn}_weight`]}; `;
          
          if (config[`${fn}_pad_val`]) {
            if (config[`${fn}_pad_type`] === 'all') cStyles += `padding: ${config[`${fn}_pad_val`]}; `;
            else cStyles += `padding-left: ${config[`${fn}_pad_val`]}; padding-top:8px; padding-bottom:8px; padding-right:8px; `;
          } else cStyles += "padding: 8px; ";
        } else {
          cStyles += "padding: 8px; ";
        }

        html += `<td style="${cStyles}">${displayValue}</td>`;
      });
      html += "</tr>";
    });

    html += "</tbody></table>";
    this._container.innerHTML = html;
    done();
  }
});
