### Kod wizualizacji (JavaScript)

Zapisz poniższy kod np. jako `grouped_tables_vis.js`:

```javascript
/**
 * Custom Visualization: Grouped Tables by Contract
 * Data Engineer: Zoptymalizowane dla Looker Custom Viz API
 */
looker.plugins.visualizations.add({
  id: "grouped_contract_tables",
  label: "Tabele Umów",
  
  // Opcje, które analityk może zmieniać w menu "Edit" -> "Format"
  options: {
    header_color: {
      type: "array",
      label: "Kolor nagłówka umowy",
      display: "colors",
      default: ["#1A73E8"] // Domyślny niebieski (Google style)
    },
    text_color: {
      type: "array",
      label: "Kolor tekstu w tabeli",
      display: "colors",
      default: ["#333333"]
    }
  },

  // 1. Inicjalizacja kontenera
  create: function(element, config) {
    element.innerHTML = "";
    this.container = element.appendChild(document.createElement("div"));
    
    // Style głównego kontenera (przewijanie w pionie, tło)
    this.container.style.width = "100%";
    this.container.style.height = "100%";
    this.container.style.overflowY = "auto";
    this.container.style.padding = "15px";
    this.container.style.boxSizing = "border-box";
    this.container.style.fontFamily = "Open Sans, Arial, sans-serif";
    this.container.style.backgroundColor = "#F8F9FA";
  },

  // 2. Renderowanie na podstawie danych
  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    // Sprawdzenie, czy są dane
    if (data.length === 0) {
      this.container.innerHTML = "<div style='text-align:center; padding: 20px;'>Brak danych do wyświetlenia.</div>";
      done();
      return;
    }

    // Pobranie wszystkich dostępnych kolumn (wymiary i miary) z zapytania
    let fields = queryResponse.fields;
    let all_columns = (fields.dimension_like || []).concat(fields.measure_like || []);

    // Walidacja: Wymagamy dokładnie lub minimum 3 kolumn
    if (all_columns.length < 3) {
      this.addError({
        title: "Nieprawidłowy format danych",
        message: "Wybierz 3 kolumny: 1. Nr Umowy, 2. Konto, 3. Wartość."
      });
      return;
    }

    // Przypisanie kluczy kolumn z Lookera
    let contract_field = all_columns[0].name;
    let account_field = all_columns[1].name;
    let value_field = all_columns[2].name;

    // KROK 1: Transformacja danych płaskich na zgrupowany obiekt (Dictionary)
    let groupedData = {};

    data.forEach(row => {
      // Pobieramy wartości. Używamy .value, ale dla wartości liczbowych warto sprawdzić .rendered (formatowanie walut/itp z LookML)
      let contract = row[contract_field].value || "Brak Umowy";
      let account = row[account_field].value || "Brak Konta";
      let value = row[value_field].rendered || row[value_field].value || "0";

      // Jeśli umowa nie istnieje jeszcze w słowniku, stwórz dla niej pustą tablicę
      if (!groupedData[contract]) {
        groupedData[contract] = [];
      }
      
      // Dodaj wiersz do danej umowy
      groupedData[contract].push({
        account: account,
        value: value
      });
    });

    // KROK 2: Budowanie kodu HTML dla zgrupowanych danych
    let htmlContent = "";
    let mainColor = config.header_color ? config.header_color[0] : "#1A73E8";
    let textColor = config.text_color ? config.text_color[0] : "#333333";

    // Iteracja po każdej umowie
    for (let contract in groupedData) {
      htmlContent += `
        <!-- Karta dla jednej umowy -->
        <div style="margin-bottom: 20px; background: #FFFFFF; border: 1px solid #E0E0E0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Nagłówek Umowy -->
          <div style="background-color: ${mainColor}; color: white; padding: 12px 20px; font-weight: 600; font-size: 16px;">
            ${contract}
          </div>

          <!-- Tabela z kontami i wartościami -->
          <div style="padding: 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: ${textColor};">
              <tbody>
      `;

      // Iteracja po kontach w ramach konkretnej umowy
      groupedData[contract].forEach((row, index) => {
        // Naprzemienne kolory wierszy tabeli dla czytelności (Zebra striping)
        let row_bg = index % 2 === 0 ? "#ffffff" : "#f9f9f9";
        
        htmlContent += `
                <tr style="background-color: ${row_bg}; border-bottom: 1px solid #EEEEEE;">
                  <td style="padding: 10px 20px; width: 60%; border-right: 1px solid #EEEEEE;">${row.account}</td>
                  <td style="padding: 10px 20px; width: 40%; text-align: right; font-weight: 500;">${row.value}</td>
                </tr>
        `;
      });

      htmlContent += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // Wstrzyknięcie wygenerowanego HTML do kontenera Lookera
    this.container.innerHTML = htmlContent;

    // Zgłoszenie do Lookera, że renderowanie zakończone (konieczne dla pobierania PDF/PNG)
    done();
  }
});
