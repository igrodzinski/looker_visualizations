looker.plugins.visualizations.add({
  id: "custom_table_regex",
  label: "Tabela (RegEx Formatowanie)",
  options: {
    header_color: {
      type: "array",
      label: "Kolor nagłówka umowy",
      display: "colors",
      default: ["#1A73E8"]
    },
    text_color: {
      type: "array",
      label: "Kolor tekstu w tabeli",
      display: "colors",
      default: ["#333333"]
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

    let wrapper = document.createElement('div');
    wrapper.className = 'looker-vis-wrapper';
    this._container = wrapper;
    element.appendChild(wrapper);
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    if (!queryResponse || !queryResponse.fields) {
      done();
      return;
    }

    const dimensions = queryResponse.fields.dimensions || [];
    const measures = queryResponse.fields.measures || [];
    const table_calculations = queryResponse.fields.table_calculations || [];
    
    // Zbieramy wszystkie pola - widoczne oraz ukryte
    const allFields = [...dimensions, ...measures, ...table_calculations];
    const visibleFields = allFields.filter(f => !f.hidden);

    if (allFields.length === 0) {
      this.addError({title: "Brak Danych", message: "Ta wizualizacja wymaga przynajmniej jednego wymiaru lub miary."});
      done();
      return;
    }

    // Budujemy listę rozwijaną do wyboru kolumn (uwzględnia ukryte)
    const columnChoices = [{"(Brak)": ""}];
    allFields.forEach(field => {
      let choice = {};
      const label = field.label_short || field.label || field.name;
      choice[label + (field.hidden ? " (Ukryta)" : "")] = field.name;
      columnChoices.push(choice);
    });

    let newOptions = { ...this.options };

    // Tworzymy 10 slotów na reguły formatowania (RegEx)
    for (let i = 1; i <= 10; i++) {
      newOptions[\`rule_\${i}_cond_col\`] = {
        section: "Formatowanie Wierszy",
        type: "string",
        label: \`Reguła \${i} - Kolumna Warunku\`,
        display: "select",
        values: columnChoices,
        default: "",
        order: i * 10 + 1
      };
      newOptions[\`rule_\${i}_cond_val\`] = {
        section: "Formatowanie Wierszy",
        type: "string",
        label: \`Reguła \${i} - Wartość Warunku\`,
        display: "text",
        default: "",
        order: i * 10 + 2
      };
      newOptions[\`rule_\${i}_regex_col\`] = {
        section: "Formatowanie Wierszy",
        type: "string",
        label: \`Reguła \${i} - Kolumna RegEx\`,
        display: "select",
        values: columnChoices,
        default: "",
        order: i * 10 + 3
      };
      newOptions[\`rule_\${i}_regex_pat\`] = {
        section: "Formatowanie Wierszy",
        type: "string",
        label: \`Reguła \${i} - Wzór RegEx\`,
        display: "text",
        default: "",
        order: i * 10 + 4
      };
    }
    
    this.trigger('registerOptions', newOptions);

    // Aktualizacja zmiennych CSS zgodnie z konfiguracją
    const headerColor = (config.header_color && config.header_color[0]) ? config.header_color[0] : "#1A73E8";
    const textColor = (config.text_color && config.text_color[0]) ? config.text_color[0] : "#333333";

    this._container.style.setProperty('--main-color', headerColor);
    this._container.style.setProperty('--text-color', textColor);

    let html = '<div class="card">';
    // html += '<div class="card-header">Dane</div>'; // Można włączyć jeśli tabela ma mieć nagłówek karty
    html += '<table class="data-table"><thead><tr>';

    // Rysowanie nagłówków tylko dla widocznych pól
    visibleFields.forEach(field => {
      html += \`<th>\${field.label_short || field.label || field.name}</th>\`;
    });
    html += '</tr></thead><tbody>';

    // Przetwarzanie wierszy z nałożeniem logiki RegEx
    data.forEach(row => {
      let shouldBoldRow = false;

      // Sprawdzamy wszystkie zdefiniowane reguły
      for (let i = 1; i <= 10; i++) {
        const condCol = config[\`rule_\${i}_cond_col\`];
        const condVal = config[\`rule_\${i}_cond_val\`];
        const regexCol = config[\`rule_\${i}_regex_col\`];
        const regexPat = config[\`rule_\${i}_regex_pat\`];

        if (regexCol && regexPat) {
          let conditionPassed = true;
          
          // Jeśli zdefiniowano kolumnę warunku i wartość warunku
          if (condCol && condVal !== undefined && condVal !== "") {
            const condCell = row[condCol];
            const condCellVal = condCell ? String(condCell.value === null ? "" : condCell.value) : "";
            if (condCellVal !== condVal) {
              conditionPassed = false;
            }
          }

          if (conditionPassed) {
             const regexCell = row[regexCol];
             const regexCellVal = regexCell ? String(regexCell.value === null ? "" : regexCell.value) : "";
             try {
                const regex = new RegExp(regexPat);
                if (regex.test(regexCellVal)) {
                  shouldBoldRow = true;
                  break; // Przerywamy jeśli któraś reguła pogrubiła wiersz
                }
             } catch (e) {
                console.error(\`Błąd wyrażenia regularnego w regule \${i}:\`, e);
             }
          }
        }
      }

      const rowStyle = shouldBoldRow ? ' style="font-weight: 900;"' : '';
      html += \`<tr\${rowStyle}>\`;

      // Renderowanie komórek tylko dla widocznych pól
      visibleFields.forEach(field => {
        const cell = row[field.name];
        let displayValue = "";
        if (cell) {
          displayValue = cell.html ? cell.html : (cell.value_formatted !== undefined ? cell.value_formatted : cell.value);
          if (displayValue === null || displayValue === undefined) displayValue = "";
        }
        
        const isNumeric = field.is_numeric || field.type === 'number';
        const alignClass = isNumeric ? 'col-numeric' : 'col-text';

        html += \`<td class="\${alignClass}">\${displayValue}</td>\`;
      });

      html += '</tr>';
    });

    html += '</tbody></table></div>';
    this._container.innerHTML = html;

    done();
  }
});
