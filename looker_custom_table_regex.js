looker.plugins.visualizations.add({
  id: "custom_table_js_logic",
  label: "Tabela (Formatowanie JS + Ukrywanie)",
  
  options: {
    header_color: {
      section: "1. Kolory", type: "array", label: "Kolor nagłówka umowy", display: "colors", default: ["#1A73E8"]
    },
    text_color: {
      section: "1. Kolory", type: "array", label: "Kolor tekstu w tabeli", display: "colors", default: ["#333333"]
    },
    custom_js_logic: {
      section: "2. Logika formatowania", type: "string", label: "Własny kod JS (zwróć true aby pogrubić)", display: "text", default: "// Użyj funkcji getValue('Nazwa') i getFilterValue('Nazwa')\nreturn false;"
    }
  },

  create: function(element, config) {
    element.innerHTML = "";
    
    let style = document.createElement('style');
    style.innerHTML = `
      .looker-vis-wrapper {
        width: 100%; height: 100%; overflow-y: auto; padding: 15px;
        box-sizing: border-box; font-family: 'Open Sans', Arial, sans-serif;
        background-color: #F8F9FA;
        --main-color: #1A73E8;
        --text-color: #333333;
      }
      .card {
        margin-bottom: 25px; background: #FFFFFF; border: 1px solid #E0E0E0;
        border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); overflow: hidden;
      }
      .card-header {
        background-color: var(--main-color); color: white;
        padding: 12px 20px; font-weight: 600; font-size: 16px;
      }
      .data-table {
        width: 100%; border-collapse: collapse; font-size: 13px; color: var(--text-color);
      }
      .data-table th {
        background-color: #F1F3F4; padding: 10px 20px; text-align: left;
        font-weight: 600; color: #5F6368; border-bottom: 2px solid #DADCE0;
      }
      .data-table td {
        padding: 10px 20px; border-bottom: 1px solid #F1F3F4; border-right: 1px solid #F8F9FA;
      }
      .data-table tr:nth-child(even) { background-color: #FAFAFA; }
      .data-table tr:hover { background-color: #F1F8FF; }
      
      .col-numeric { text-align: right !important; }
      .col-text { text-align: left !important; }
      
      .summary-row {
        background-color: #F4F8FD; border-top: 2px solid var(--main-color);
      }
      .summary-row td {
        font-weight: 700; font-size: 14px; padding: 12px 20px;
      }
      .summary-label {
        color: var(--main-color); text-transform: uppercase; font-size: 12px;
      }
    `;
    element.appendChild(style);

    this.container = element.appendChild(document.createElement("div"));
    this.container.className = "looker-vis-wrapper";
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    if (data.length === 0) {
      this.container.innerHTML = "<div style='text-align:center; padding: 20px;'>Brak danych.</div>";
      done();
      return;
    }

    let fields = queryResponse.fields;
    const dimensions = fields.dimension_like || [];
    const measures = fields.measure_like || [];
    const table_calculations = fields.table_calculations || [];
    
    const allFields = dimensions.concat(measures).concat(table_calculations);
    const visibleFields = allFields.filter(f => !f.hidden);

    if (allFields.length === 0) {
      this.addError({title: "Błąd", message: "Wymagane są wymiary lub miary."});
      done();
      return;
    }

    // --- NAPRAWA BŁĘDU: Rejestrujemy opcje tylko, gdy zmieni się układ kolumn ---
    const currentFieldsStr = visibleFields.map(f => f.name).join(',');
    
    if (this._previousFieldsStr !== currentFieldsStr) {
      this._previousFieldsStr = currentFieldsStr;
      
      let dynamicOptions = {
        header_color: {
          section: "1. Kolory", type: "array", label: "Kolor nagłówka umowy", display: "colors", default: ["#1A73E8"]
        },
        text_color: {
          section: "1. Kolory", type: "array", label: "Kolor tekstu w tabeli", display: "colors", default: ["#333333"]
        },
        custom_js_logic: {
          section: "2. Logika formatowania", type: "string", label: "Własny kod JS (zwróć true aby pogrubić)", display: "text", default: "// Użyj funkcji getValue('Nazwa') i getFilterValue('Nazwa')\nreturn false;"
        }
      };

      visibleFields.forEach(field => {
        const fieldName = field.label_short || field.label || field.name;
        dynamicOptions[`hide_${field.name}`] = {
          section: "3. Ukrywanie kolumn",
          type: "boolean",
          label: `Ukryj: ${fieldName}`,
          default: false
        };
      });

      this.trigger('registerOptions', dynamicOptions);
    }

    // Filtrujemy kolumny, sprawdzając, czy użytkownik ustawił hide = true w configu
    const fieldsToRender = visibleFields.filter(field => !config[`hide_${field.name}`]);

    const getRealFieldName = (inputStr) => {
      if (!inputStr) return null;
      const lowerInput = inputStr.toLowerCase().trim();
      const match = allFields.find(f => 
        f.name.toLowerCase() === lowerInput || 
        (f.label_short && f.label_short.toLowerCase() === lowerInput) || 
        (f.label && f.label.toLowerCase() === lowerInput)
      );
      return match ? match.name : null;
    };

    let customLogicFn = null;
    const rawJs = config.custom_js_logic;
    if (rawJs && rawJs.trim() !== "") {
      try {
        customLogicFn = new Function('row', 'getValue', 'getFilterValue', rawJs);
      } catch (e) {
        console.error("Błąd kompilacji własnego kodu JS:", e);
        this.addError({title: "Błąd kodu JS", message: "Sprawdź składnię w panelu opcji."});
      }
    }

    const headerColor = (config.header_color && config.header_color[0]) ? config.header_color[0] : "#1A73E8";
    const textColor = (config.text_color && config.text_color[0]) ? config.text_color[0] : "#333333";
    this.container.style.setProperty('--main-color', headerColor);
    this.container.style.setProperty('--text-color', textColor);

    let html = '<div class="card">';
    html += '<table class="data-table"><thead><tr>';

    fieldsToRender.forEach(field => {
      html += `<th>${field.label_short || field.label || field.name}</th>`;
    });
    html += '</tr></thead><tbody>';

    data.forEach(row => {
      let shouldBoldRow = false;

      const getValue = (colName) => {
        const realName = getRealFieldName(colName);
        if (realName && row[realName]) {
          return row[realName].value;
        }
        return null;
      };

      const getFilterValue = (colName) => {
        const realName = getRealFieldName(colName);
        if (realName && queryResponse.query && queryResponse.query.filters) {
          return queryResponse.query.filters[realName];
        }
        return null;
      };

      if (customLogicFn) {
        try {
          shouldBoldRow = customLogicFn(row, getValue, getFilterValue);
        } catch (e) {
          console.error("Błąd wykonania własnego kodu JS dla wiersza:", e);
        }
      }

      const rowStyle = shouldBoldRow ? ' style="font-weight: 900;"' : '';
      html += `<tr${rowStyle}>`;

      fieldsToRender.forEach(field => {
        const cell = row[field.name];
        let displayValue = "";
        if (cell) {
          displayValue = cell.html ? cell.html : (cell.rendered !== undefined ? cell.rendered : (cell.value_formatted !== undefined ? cell.value_formatted : cell.value));
          if (displayValue === null || displayValue === undefined) displayValue = "";
        }
        
        const isNumeric = field.is_numeric || field.type === 'number';
        const alignClass = isNumeric ? 'col-numeric' : 'col-text';

        html += `<td class="${alignClass}">${displayValue}</td>`;
      });

      html += '</tr>';
    });

    html += '</tbody></table></div>';
    this.container.innerHTML = html;

    done();
  }
});
