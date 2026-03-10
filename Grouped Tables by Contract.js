looker.plugins.visualizations.add({
  id: "grouped_contract_tables_dynamic",
  label: "Dynamiczne Tabele Umów",
  
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
    
    // Wstrzykiwanie scentralizowanych stylów CSS (Predefiniowane style tabeli)
    // Używamy zmiennych CSS (var(--nazwa)), aby móc je dynamicznie podmieniać w updateAsync
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

    // Główny kontener na dane
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

    // Zbieranie wszystkich kolumn z Lookera w odpowiedniej kolejności
    let fields = queryResponse.fields;
    let all_columns = (fields.dimension_like || []).concat(fields.measure_like || []);

    if (all_columns.length < 2) {
      this.addError({ title: "Błąd", message: "Wymagane są minimum 2 kolumny (1 do grupowania, 1 do wyświetlenia)." });
      return;
    }

    // 1 kolumna to zawsze nasz "Klucz" (Nr Umowy)
    let group_field = all_columns[0];
    // Pozostałe kolumny budują dynamiczną tabelę (np. 2 dimensions + 2 measures)
    let table_columns = all_columns.slice(1);

    // Aktualizacja zmiennych CSS na podstawie menu Lookera
    this.container.style.setProperty('--main-color', config.header_color ? config.header_color[0] : '#1A73E8');
    this.container.style.setProperty('--text-color', config.text_color ? config.text_color[0] : '#333333');

    let groupedData = {};

    // KROK 1: Dynamiczne Grupowanie i Sumowanie
    data.forEach(row => {
      let group_val = row[group_field.name].value || "Brak Danych";

      if (!groupedData[group_val]) {
        groupedData[group_val] = { rows: [], sums: {}, is_numeric: {} };
      }

      let current_row_data = {};

      table_columns.forEach(col => {
        let field_name = col.name;
        let raw_value = row[field_name].value;
        // rendered uwzględnia znaczki walut i formatowanie z LookML
        let display_value = row[field_name].rendered || raw_value || (raw_value === 0 ? "0" : ""); 
        
        current_row_data[field_name] = display_value;

        // Analiza, czy kolumna ma wartości liczbowe do zsumowania
        if (raw_value !== null && raw_value !== undefined && raw_value !== "") {
          let num = parseFloat(raw_value);
          if (!isNaN(num)) {
            groupedData[group_val].is_numeric[field_name] = true; // Oznacz kolumnę jako liczbową
            groupedData[group_val].sums[field_name] = (groupedData[group_val].sums[field_name] || 0) + num;
          }
        }
      });

      groupedData[group_val].rows.push(current_row_data);
    });

    // KROK 2: Generowanie HTML (przy użyciu predefiniowanych klas CSS)
    let htmlContent = "";

    for (let group_val in groupedData) {
      let groupObj = groupedData[group_val];

      htmlContent += `<div class="card">`;
      htmlContent += `<div class="card-header">${group_val}</div>`;
      htmlContent += `<table class="data-table">`;
      
      // -- NAGŁÓWKI TABELI (Kolumny) --
      htmlContent += `<thead><tr>`;
      table_columns.forEach(col => {
        // Label_short to czysta nazwa kolumny (bez nazwy widoku np. 'Wartość' zamiast 'Finanse Wartość')
        let col_label = col.label_short || col.label || col.name;
        // Wyrównanie do prawej, jeśli w grupie wykryto liczby
        let align_class = groupObj.is_numeric[col.name] ? "col-numeric" : "col-text";
        htmlContent += `<th class="${align_class}">${col_label}</th>`;
      });
      htmlContent += `</tr></thead>`;

      // -- WIERSZE Z DANYMI --
      htmlContent += `<tbody>`;
      groupObj.rows.forEach(row_data => {
        htmlContent += `<tr>`;
        table_columns.forEach(col => {
          let align_class = groupObj.is_numeric[col.name] ? "col-numeric" : "col-text";
          htmlContent += `<td class="${align_class}">${row_data[col.name]}</td>`;
        });
        htmlContent += `</tr>`;
      });

      // -- WIERSZ PODSUMOWUJĄCY (Suma) --
      htmlContent += `<tr class="summary-row">`;
      table_columns.forEach((col, index) => {
        let align_class = groupObj.is_numeric[col.name] ? "col-numeric" : "col-text";
        
        // Pierwsza kolumna tabeli zawsze dostaje napis "Suma:" zamiast pustego pola
        if (index === 0) {
          if (groupObj.is_numeric[col.name]) {
             // Zabezpieczenie: Jeśli pierwsza kolumna to akurat liczby (rzadki przypadek)
             let formattedSum = groupObj.sums[col.name].toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
             htmlContent += `<td class="${align_class}"><span class="summary-label">Suma: </span> ${formattedSum}</td>`;
          } else {
             htmlContent += `<td class="summary-label">Suma:</td>`;
          }
        } else {
          // Dla kolejnych kolumn weryfikujemy czy są liczbowe
          if (groupObj.is_numeric[col.name]) {
            let sum_val = groupObj.sums[col.name] || 0;
            let formattedSum = sum_val.toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
            htmlContent += `<td class="${align_class}">${formattedSum}</td>`;
          } else {
            // Zostawiamy puste miejsce pod kolumnami tekstowymi (Dimension)
            htmlContent += `<td></td>`;
          }
        }
      });
      htmlContent += `</tr>`;
      
      htmlContent += `</tbody></table></div>`;
    }

    this.container.innerHTML = htmlContent;
    done();
  }
});
