looker.plugins.visualizations.add({
  id: "grouped_contract_tables_dynamic",
  label: "Dynamiczne Tabele Umów",
  
  options: {
    group_column: {
      type: "string",
      label: "Grupuj po (Nazwa kolumny z Lookera)",
      default: "",
      placeholder: "np. umowa.typ"
    },
    color_theme: {
      type: "string",
      label: "Motyw kolorystyczny",
      display: "select",
      values: [
        {"Corporate Blue": "blue"},
        {"Modern Dark": "dark"},
        {"Clean Minimal": "minimal"}
      ],
      default: "blue"
    }
  },

  create: function(element, config) {
    element.innerHTML = "";
    
    let style = document.createElement('style');
    style.innerHTML = `
      .looker-vis-wrapper { width: 100%; height: 100%; overflow-y: auto; padding: 15px; box-sizing: border-box; font-family: 'Open Sans', Arial, sans-serif; background-color: var(--page-bg); color: var(--text-color); }
      .card { margin-bottom: 25px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); overflow: hidden; }
      .card-header { background-color: var(--main-color); color: var(--header-text); padding: 12px 20px; font-weight: 600; font-size: 16px; }
      .data-table { width: 100%; border-collapse: collapse; font-size: 13px; color: var(--text-color); }
      .data-table th { background-color: var(--th-bg); padding: 10px 20px; text-align: left; font-weight: 600; border-bottom: 2px solid var(--border-color); cursor: pointer; user-select: none; transition: filter 0.2s; }
      .data-table th:hover { filter: brightness(0.95); }
      .data-table td { padding: 10px 20px; border-bottom: 1px solid var(--border-color); border-right: 1px solid transparent; }
      .data-table tr:nth-child(even) { background-color: var(--alt-row); }
      .data-table tr:hover { background-color: var(--hover-bg); }
      .col-numeric { text-align: right !important; }
      .col-text { text-align: left !important; }
      .summary-row { background-color: var(--th-bg); border-top: 2px solid var(--main-color); }
      .summary-row td { font-weight: 700; font-size: 14px; padding: 12px 20px; }
      .summary-label { color: var(--main-color); text-transform: uppercase; font-size: 12px; }
      .sort-icon { font-size: 10px; margin-left: 5px; color: var(--text-color); opacity: 0.7; }
      .val-negative { color: #D32F2F; font-weight: 500; }
    `;
    element.appendChild(style);

    this.container = element.appendChild(document.createElement("div"));
    this.container.className = "looker-vis-wrapper";
    this.sortState = { field: null, direction: 'asc' };
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();
    if (data.length === 0) {
      this.container.innerHTML = "<div style='text-align:center; padding: 20px;'>Brak danych.</div>";
      done(); return;
    }

    let fields = queryResponse.fields;
    let all_columns = (fields.dimension_like || []).concat(fields.measure_like || []);
    let measure_names = (fields.measure_like || []).map(m => m.name);
    
    if (all_columns.length < 2) {
      this.addError({ title: "Błąd konfiguracji", message: "Wymagane są minimum 2 kolumny (1 do grupowania, 1 do wyświetlenia)." });
      done(); return;
    }

    let group_field = all_columns[0];
    if (config.group_column && config.group_column.trim() !== "") {
      let found = all_columns.find(c => c.name === config.group_column || c.label_short === config.group_column);
      if (found) group_field = found;
    }
    let table_columns = all_columns.filter(c => c.name !== group_field.name);

    const themes = {
      blue: { page_bg: "#F8F9FA", bg: "#FFFFFF", main: "#1A73E8", text: "#333333", th_bg: "#F1F3F4", border: "#DADCE0", alt_row: "#FAFAFA", hover: "#F1F8FF", header_text: "#FFFFFF" },
      dark: { page_bg: "#121212", bg: "#1E1E1E", main: "#333333", text: "#E0E0E0", th_bg: "#2C2C2C", border: "#424242", alt_row: "#252525", hover: "#383838", header_text: "#90CAF9" },
      minimal: { page_bg: "#FFFFFF", bg: "#FFFFFF", main: "#212121", text: "#212121", th_bg: "#F8F9FA", border: "#EEEEEE", alt_row: "#FFFFFF", hover: "#F5F5F5", header_text: "#FFFFFF" }
    };
    let t = themes[config.color_theme] || themes.blue;
    for (let key in t) {
      this.container.style.setProperty(`--${key.replace('_', '-')}`, t[key]);
    }

    let groupedData = {};

    data.forEach(row => {
      let group_val = row[group_field.name].value || "Brak Danych";
      if (!groupedData[group_val]) groupedData[group_val] = { rows: [], sums: {}, is_numeric: {} };
      let current_row_data = {};

      table_columns.forEach(col => {
        let field_name = col.name;
        let raw_value = row[field_name].value;
        current_row_data[field_name] = { raw: raw_value, display: row[field_name].rendered || raw_value || (raw_value === 0 ? "0" : "") };
        
        if (measure_names.includes(field_name) && raw_value !== null && raw_value !== "") {
          let num = parseFloat(raw_value);
          if (!isNaN(num)) {
            groupedData[group_val].is_numeric[field_name] = true;
            groupedData[group_val].sums[field_name] = (groupedData[group_val].sums[field_name] || 0) + num;
          }
        }
      });
      groupedData[group_val].rows.push(current_row_data);
    });

    this.groupedData = groupedData;
    this.table_columns = table_columns;
    this.renderTables();
    done();
  },

  renderTables: function() {
    let htmlContent = "";
    for (let group_val in this.groupedData) {
      let groupObj = this.groupedData[group_val];

      if (this.sortState.field) {
        groupObj.rows.sort((a, b) => {
          let valA = a[this.sortState.field].raw;
          let valB = b[this.sortState.field].raw;
          if (valA == null) valA = ""; if (valB == null) valB = "";
          if (typeof valA === 'string' && typeof valB === 'string') return this.sortState.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
          return this.sortState.direction === 'asc' ? valA - valB : valB - valA;
        });
      }

      htmlContent += `<div class="card"><div class="card-header">${group_val}</div><table class="data-table"><thead><tr>`;
      
      this.table_columns.forEach(col => {
        let align_class = groupObj.is_numeric[col.name] ? "col-numeric" : "col-text";
        let sortIcon = this.sortState.field === col.name ? (this.sortState.direction === 'asc' ? "▲" : "▼") : "";
        htmlContent += `<th class="${align_class}" data-field="${col.name}" title="Sortuj">${col.label_short || col.name} <span class="sort-icon">${sortIcon}</span></th>`;
      });
      htmlContent += `</tr></thead><tbody>`;

      groupObj.rows.forEach(row_data => {
        htmlContent += `<tr>`;
        this.table_columns.forEach(col => {
          let align_class = groupObj.is_numeric[col.name] ? "col-numeric" : "col-text";
          let raw_val = row_data[col.name].raw;
          let neg_class = (typeof raw_val === 'number' && raw_val < 0) ? "val-negative" : "";
          htmlContent += `<td class="${align_class} ${neg_class}" title="${raw_val}">${row_data[col.name].display}</td>`;
        });
        htmlContent += `</tr>`;
      });

      htmlContent += `<tr class="summary-row">`;
      this.table_columns.forEach((col, index) => {
        let align_class = groupObj.is_numeric[col.name] ? "col-numeric" : "col-text";
        if (groupObj.is_numeric[col.name]) {
          let sum_val = groupObj.sums[col.name] || 0;
          let formattedSum = sum_val.toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
          htmlContent += `<td class="${align_class}">${index === 0 ? '<span class="summary-label">Suma: </span> ' : ''}${formattedSum}</td>`;
        } else {
          htmlContent += `<td class="${index === 0 ? 'summary-label' : ''}">${index === 0 ? 'Suma:' : ''}</td>`;
        }
      });
      htmlContent += `</tr></tbody></table></div>`;
    }
    this.container.innerHTML = htmlContent;

    this.container.querySelectorAll('th').forEach(th => {
      th.addEventListener('click', (e) => {
        let field = e.currentTarget.getAttribute('data-field');
        this.sortState.direction = (this.sortState.field === field && this.sortState.direction === 'asc') ? 'desc' : 'asc';
        this.sortState.field = field;
        this.renderTables(); 
      });
    });
  }
});