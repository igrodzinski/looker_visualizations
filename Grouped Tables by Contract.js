looker.plugins.visualizations.add({
  id: "grouped_contract_tables_with_sum",
  label: "Tabele Umów (z podsumowaniem)",
  
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
    this.container = element.appendChild(document.createElement("div"));
    
    this.container.style.width = "100%";
    this.container.style.height = "100%";
    this.container.style.overflowY = "auto";
    this.container.style.padding = "15px";
    this.container.style.boxSizing = "border-box";
    this.container.style.fontFamily = "Open Sans, Arial, sans-serif";
    this.container.style.backgroundColor = "#F8F9FA";
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    if (data.length === 0) {
      this.container.innerHTML = "<div style='text-align:center; padding: 20px;'>Brak danych do wyświetlenia.</div>";
      done();
      return;
    }

    let fields = queryResponse.fields;
    let all_columns = (fields.dimension_like || []).concat(fields.measure_like || []);

    if (all_columns.length < 3) {
      this.addError({
        title: "Nieprawidłowy format danych",
        message: "Wybierz 3 kolumny: 1. Nr Umowy, 2. Konto, 3. Wartość."
      });
      return;
    }

    let contract_field = all_columns[0].name;
    let account_field = all_columns[1].name;
    let value_field = all_columns[2].name;

    // KROK 1: Transformacja danych płaskich i OBLICZANIE SUMY w locie
    let groupedData = {};

    data.forEach(row => {
      let contract = row[contract_field].value || "Brak Umowy";
      let account = row[account_field].value || "Brak Konta";
      
      // Looker dostarcza dwie rzeczy: 
      // 1. .value (surowa wartość z bazy, idealna do matematyki)
      // 2. .rendered (tekst po nałożeniu LookML np. "1 241,00 zł")
      let raw_value = row[value_field].value; 
      let display_value = row[value_field].rendered || raw_value || "0";

      // Jeśli umowy jeszcze nie ma w obiekcie, inicjalizujemy ją
      if (!groupedData[contract]) {
        groupedData[contract] = {
          rows: [],
          sum: 0 // Inicjalizacja licznika dla danej umowy
        };
      }
      
      // Zapisujemy wiersz do wyświetlenia
      groupedData[contract].rows.push({
        account: account,
        display_value: display_value
      });

      // Omijanie wartości tekstowych i sumowanie tylko liczbowych
      if (raw_value !== null && raw_value !== undefined) {
        let num = parseFloat(raw_value);
        if (!isNaN(num)) {
          groupedData[contract].sum += num;
        }
      }
    });

    // KROK 2: Generowanie HTML z tabelami
    let htmlContent = "";
    let mainColor = config.header_color ? config.header_color[0] : "#1A73E8";
    let textColor = config.text_color ? config.text_color[0] : "#333333";

    for (let contract in groupedData) {
      let contractData = groupedData[contract];
      
      // Formatowanie sumy (np. 1234.5 -> "1 234,50" - standard polski)
      // Jeśli chcesz inny format (np. amerykański), zmień 'pl-PL' na 'en-US'
      let formattedSum = contractData.sum.toLocaleString('pl-PL', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 2 
      });

      htmlContent += `
        <div style="margin-bottom: 20px; background: #FFFFFF; border: 1px solid #E0E0E0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
          
          <div style="background-color: ${mainColor}; color: white; padding: 12px 20px; font-weight: 600; font-size: 16px;">
            ${contract}
          </div>

          <div style="padding: 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: ${textColor};">
              <tbody>
      `;

      // Renderowanie wierszy z kontami
      contractData.rows.forEach((row, index) => {
        let row_bg = index % 2 === 0 ? "#ffffff" : "#fbfbfb";
        htmlContent += `
                <tr style="background-color: ${row_bg}; border-bottom: 1px solid #EEEEEE;">
                  <td style="padding: 10px 20px; width: 60%; border-right: 1px solid #EEEEEE;">${row.account}</td>
                  <td style="padding: 10px 20px; width: 40%; text-align: right; font-weight: 500;">${row.display_value}</td>
                </tr>
        `;
      });

      // Dodanie wiersza podsumowującego SUMĘ na końcu tabeli
      htmlContent += `
                <tr style="background-color: #f1f8ff; border-top: 2px solid ${mainColor};">
                  <td style="padding: 12px 20px; font-weight: 700; width: 60%; border-right: 1px solid #EEEEEE; color: ${mainColor}; text-transform: uppercase; font-size: 13px;">
                    Suma:
                  </td>
                  <td style="padding: 12px 20px; width: 40%; text-align: right; font-weight: 700; font-size: 15px;">
                    ${formattedSum}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = htmlContent;
    done();
  }
});
