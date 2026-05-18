looker.plugins.visualizations.add({
  id: "custom_table_js_logic",
  label: "Tabela (Formatowanie JS + Ukrywanie)",
  
  options: {
    color_theme: {
      section: "1. Motyw",
      type: "string",
      label: "Motyw kolorystyczny",
      display: "select",
      values: [
        {"Clean Minimal": "minimal"}
      ],
      default: "minimal"
    },
    custom_js_logic: {
      section: "2. Logika formatowania", 
      type: "string", 
      label: "Własny kod JS (zwróć true lub string z CSS)", 
      display: "text", 
      default: "// np. return 'color: red; font-weight: bold;'\nreturn false;"
    }
  },

  create: function(element, config) {
    element.innerHTML = "";
    
    let style = document.createElement('style');
    style.innerHTML = `
      .looker-vis-wrapper {
        width: 100%; height: 100%; overflow-y: auto; padding: 15px;
        box-sizing: border-box; font-family: 'Open Sans', Arial, sans-serif;
        background-color: var(--page-bg);
      }
      .card {
        margin-bottom: 25px; background: var(--bg-color); border: 1px solid var(--border-color);
        border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); overflow: hidden;
      }
      .card-header {
        background-color: var(--main-color); color: var(--header-text);
        padding: 12px 20px; font-weight: 600; font-size: 16px;
      }
      .data-table {
        width: 100%; border-collapse: collapse; font-size: 13px; color: var(--text-color);
      }
      .data-table th {
        background-color: var(--th-bg); padding: 10px 20px; text-align: left;
        font-weight: 600; border-bottom: 2px solid var(--border-color);
      }
      .data-table td {
        padding: 10px 20px; border-bottom: 1px solid var(--border-color); border-right: 1px solid transparent;
      }
      .data-table tr:nth-child(even) { background-color: var(--alt-row); }
      .data-table tr:hover { background-color: var(--hover-bg); }
      
      .col-numeric { text-align: right !important; }
      .col-text { text-align: left !important; }
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
    
    let allFieldsList = (fields.dimensions || []).concat(fields.measures || []).concat(fields.table_calculations || []).concat(fields.dimension_like || []).concat(fields.measure_like || []);
    const allFields = allFieldsList.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i);
    const visibleFields = allFields.filter(f => !f.hidden);

    if (allFields.length === 0) {
      this.addError({title: "Błąd", message: "Wymagane są wymiary lub miary."});
      done();
      return;
    }

    const currentFieldsStr = visibleFields.map(f => f.name).join(',');
    
    if (this._previousFieldsStr !== currentFieldsStr) {
      this._previousFieldsStr = currentFieldsStr;
      
      let dynamicOptions = {
        color_theme: {
          section: "1. Motyw",
          type: "string",
          label: "Motyw kolorystyczny",
          display: "select",
          values: [
            {"Clean Minimal": "minimal"}
          ],
          default: "minimal"
        },
        custom_js_logic: {
          section: "2. Logika formatowania", 
          type: "string", 
          label: "Własny kod JS (zwróć true lub string z CSS)", 
          display: "text", 
          default: "// np. return 'color: red; font-weight: bold;'\nreturn false;"
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

    const fieldsToRender = visibleFields.filter(field => !config[`hide_${field.name}`]);

    // BEZPIECZNA FUNKCJA BEZ POLSKICH ZNAKÓW W KODZIE
    const getRealFieldName = (inputStr) => {
      if (!inputStr) return null;
      const searchStr = inputStr.toLowerCase().trim();
      
      const match = allFields.find(f => 
        (f.label_short && f.label_short.toLowerCase() === searchStr) || 
        (f.label && f.label.toLowerCase() === searchStr) ||
        f.name.toLowerCase() === searchStr
      );
      if (match) return match.name;

      if (data.length > 0) {
        const rowKeys = Object.keys(data[0]);
        // Usuwanie akcentów i znaków specjalnych bezpiecznie (bez regexów z pl znakami)
        const safeSearchStr = searchStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const simplifiedSearch = safeSearchStr.replace(/[^a-z0-9]/gi, '');
        
        const keyMatch = rowKeys.find(k => {
          const fieldPart = k.split('.').pop();
          const safeFieldPart = fieldPart.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const simplifiedKey = safeFieldPart.replace(/[^a-z0-9]/gi, '');
          
          return simplifiedKey === simplifiedSearch || k.toLowerCase() === searchStr;
        });
        
        if (keyMatch) return keyMatch;
      }
      return null;
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

    const themes = {
      minimal: { page_bg: "#FFFFFF", bg: "#FFFFFF", main: "#212121", text: "#212121", th_bg: "#F8F9FA", border: "#EEEEEE", alt_row: "#FFFFFF", hover: "#F5F5F5", header_text: "#FFFFFF" }
    };
    
    let t = themes[config.color_theme] || themes.minimal;
    for (let key in t) {
      this.container.style.setProperty(`--${key.replace('_', '-')}`, t[key]);
    }

    let html = '<div class="card">';
    html += '<table class="data-table"><thead><tr>';

    fieldsToRender.forEach(field => {
      html += `<th>${field.label_short || field.label || field.name}</th>`;
    });
    html += '</tr></thead><tbody>';

    data.forEach(row => {
      let formatResult = false; 

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
          formatResult = customLogicFn(row, getValue, getFilterValue);
        } catch (e) {
          console.error("Błąd wykonania własnego kodu JS dla wiersza:", e);
        }
      }

      let rowStyleAttr = '';
      if (typeof formatResult === 'string' && formatResult.trim() !== '') {
        rowStyleAttr = ` style="${formatResult}"`;
      } else if (formatResult === true) {
        rowStyleAttr = ' style="font-weight: 900;"';
      }

      html += `<tr${rowStyleAttr}>`;

      fieldsToRender.forEach(field => {
        const cell = row[field.name];
        let displayValue = "";
        
        // Zabezpieczone, proste IF/ELSE zamiast operatorów ternarnych (? :)
        if (cell) {
          if (cell.html !== undefined && cell.html !== null) {
            displayValue = cell.html;
          } else if (cell.rendered !== undefined && cell.rendered !== null) {
            displayValue = cell.rendered;
          } else if (cell.value_formatted !== undefined && cell.value_formatted !== null) {
            displayValue = cell.value_formatted;
          } else {
            displayValue = cell.value;
          }
          
          if (displayValue === null || displayValue === undefined) {
            displayValue = "";
          }
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
