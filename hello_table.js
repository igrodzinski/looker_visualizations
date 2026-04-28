looker.plugins.visualizations.add({
  // Identyfikator wizualizacji
  id: "moja_zielona_tabela",
  label: "Moja Zielona Tabela",

  // Opcje - na razie usuwamy je dla uproszczenia, bo styl jest "zaszyty" na stałe
  options: {},

  // --- FUNKCJA CREATE: Uruchamiana raz na początku ---
  // Tutaj definiujemy CSS i tworzymy główny kontener.
  create: function(element, config) {
    // Wstrzykujemy CSS definiujący wygląd tabeli
    element.innerHTML = `
      <style>
        .my-custom-table {
          font-family: Arial, sans-serif;
          border-collapse: collapse;
          width: 100%;
          font-size: 13px;
        }

        /* Stylizacja nagłówków - TO JEST KLUCZOWE DLA TWOJEGO ZAPYTANIA */
        .my-custom-table th {
          border: 1px solid #ddd;
          padding: 12px 8px;
          text-align: left;
          background-color: #008000; /* Zielone tło */
          color: white; /* Białe napisy */
          font-weight: bold;
        }

        /* Stylizacja zwykłych komórek */
        .my-custom-table td {
          border: 1px solid #ddd;
          padding: 8px;
        }

        /* Opcjonalnie: paski na co drugim wierszu dla lepszej czytelności */
        .my-custom-table tr:nth-child(even){background-color: #f9f9f9;}

        /* Efekt najechania myszką */
        .my-custom-table tr:hover {background-color: #f1f1f1;}
      </style>
    `;

    // Tworzymy kontener na tabelę
    this._tableContainer = element.appendChild(document.createElement("div"));
  },


  // --- FUNKCJA UPDATE ASYNC: Uruchamiana przy każdej zmianie danych ---
  // Tutaj budujemy HTML tabeli na podstawie otrzymanych danych.
  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    // Sprawdzamy, czy są jakiekolwiek dane do wyświetlenia
    if (queryResponse.fields.dimensions.length == 0 && queryResponse.fields.measures.length == 0) {
      this.addError({title: "Brak danych", message: "Dodaj wymiary lub miary do zapytania."});
      return;
    }

    // Łączymy wymiary i miary w jedną listę kolumn do wyświetlenia
    const allFields = [...queryResponse.fields.dimensions, ...queryResponse.fields.measures];

    // --- BUDOWANIE NAGŁÓWKA TABELI (<thead>) ---
    let html = '<table class="my-custom-table"><thead><tr>';

    // Pętla po wszystkich polach, aby stworzyć nagłówki kolumn <th>
    allFields.forEach(field => {
      // Używamy 'label_short' jeśli istnieje, w przeciwnym razie 'label'
      let headerText = field.label_short || field.label;
      html += `<th>${headerText}</th>`;
    });

    html += '</tr></thead><tbody>';


    // --- BUDOWANIE CIAŁA TABELI (<tbody>) ---
    // Pętla po każdym wierszu danych
    data.forEach(row => {
      html += '<tr>';
      // Wewnętrzna pętla po każdej kolumnie w danym wierszu
      allFields.forEach(field => {
        // Pobieramy komórkę danych dla danego pola
        let cell = row[field.name];
        // LookerCharts.Utils.htmlForCell(cell) to pomocnicza funkcja Lookera,
        // która bezpiecznie renderuje wartość, w tym linki (drill-downs) i formatowanie liczb.
        html += `<td>${LookerCharts.Utils.htmlForCell(cell)}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table>';

    // Wstawiamy gotowy HTML tabeli do kontenera
    this._tableContainer.innerHTML = html;

    // Sygnalizujemy Lookerowi zakończenie renderowania
    done();
  }
});
