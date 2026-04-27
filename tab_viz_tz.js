/**
 * Rejestracja nowej wizualizacji w Lookerze.
 */
looker.plugins.visualizations.add({
  // Unikalny identyfikator Twojej wizualizacji
  id: "super_custom_table",
  // Nazwa, która wyświetli się użytkownikom w Lookerze
  label: "Moja Konfigurowalna Tabela",

  // -----------------------------------------------------------
  // 1. OPCJE STYLOWANIA (widoczne w panelu ustawień Lookera)
  // -----------------------------------------------------------
  options: {
    font_family: {
      type: "string",
      label: "Czcionka",
      display: "select",
      values: [
        {"Arial": "Arial, sans-serif"},
        {"Times New Roman": "'Times New Roman', serif"},
        {"Courier New": "'Courier New', monospace"}
      ],
      default: "Arial, sans-serif",
      section: "Styl"
    },
    font_size: {
      type: "number",
      label: "Rozmiar czcionki (px)",
      default: 14,
      section: "Styl"
    },
    header_bg_color: {
      type: "array",
      label: "Kolor tła nagłówka",
      display: "colors",
      default: ["#4CAF50"], // Domyślnie zielony
      section: "Kolory"
    },
    row_bg_color: {
      type: "array",
      label: "Kolor tła wierszy",
      display: "colors",
      default: ["#ffffff"], // Domyślnie biały
      section: "Kolory"
    },
    cell_padding: {
      type: "number",
      label: "Odstęp wewnątrz komórki (Padding w px)",
      default: 8,
      section: "Rozmiary i Obramowanie"
    },
    border_style: {
      type: "string",
      label: "Styl obramowania",
      display: "select",
      values: [
        {"Brak": "none"},
        {"Ciągła linia": "solid"},
        {"Kropki": "dotted"}
      ],
      default: "solid",
      section: "Rozmiary i Obramowanie"
    },
    border_color: {
      type: "array",
      label: "Kolor obramowania",
      display: "colors",
      default: ["#dddddd"], // Jasnoszary
      section: "Rozmiary i Obramowanie"
    }
  },

  // -----------------------------------------------------------
  // 2. TWORZENIE (inicjalizacja głównego elementu)
  // -----------------------------------------------------------
  create: function(element, config) {
    // element - to pusty obszar (div) dostarczony przez Lookera, 
    // w którym możemy rysować naszą wizualizację.

    // Czyścimy zawartość, aby mieć pewność, że jest pusta
    element.innerHTML = "";

    // Tworzymy główny element tabeli w HTML
    this.tableContainer = document.createElement("table");
    
    // Dodajemy go do ekranu
    element.appendChild(this.tableContainer);
  },

  // -----------------------------------------------------------
  // 3. AKTUALIZACJA I RYSOWANIE
  // -----------------------------------------------------------
  updateAsync: function(data, element, config, queryResponse, details, done) {
    // data - to tablica z wynikami Twojego zapytania (wiersze danych)
    // config - to obiekt zawierający aktualne ustawienia z panelu "options"

    // Krok 1: Wyczyść starą tabelę przed narysowaniem nowej
    this.tableContainer.innerHTML = "";

    // Krok 2: Pobierz style z konfiguracji i przypisz je do naszej tabeli
    // Używamy bezpiecznych wartości domyślnych na wypadek, gdyby ustawienia nie były załadowane
    this.tableContainer.style.fontFamily = config.font_family || "Arial";
    this.tableContainer.style.fontSize = (config.font_size || 14) + "px";
    this.tableContainer.style.borderCollapse = "collapse"; // Ładne łączenie obramowań
    this.tableContainer.style.width = "100%"; // Tabela zajmuje całą szerokość

    // Przygotowanie zmiennych do tworzenia HTML tabeli
    // Uwaga: W docelowej implementacji tutaj będziesz musiał przeiterować 
    // przez 'queryResponse.fields' dla nagłówków i przez 'data' dla wierszy.
    let tableHTML = "<thead><tr>";

    // Przykładowy nagłówek (docelowo generowany z danych)
    let headerColor = config.header_bg_color ? config.header_bg_color[0] : "#4CAF50";
    let padding = (config.cell_padding || 8) + "px";
    let border = `1px ${config.border_style || 'solid'} ${config.border_color ? config.border_color[0] : '#ddd'}`;

    tableHTML += `<th style="background-color: ${headerColor}; padding: ${padding}; border: ${border};">Przykładowa Kolumna 1</th>`;
    tableHTML += `<th style="background-color: ${headerColor}; padding: ${padding}; border: ${border};">Przykładowa Kolumna 2</th>`;
    tableHTML += "</tr></thead><tbody>";

    // Przykładowe wiersze (docelowo generowane pętlą z obiektu 'data')
    let rowColor = config.row_bg_color ? config.row_bg_color[0] : "#ffffff";

    for (let i = 0; i < 3; i++) {
      tableHTML += `<tr>`;
      tableHTML += `<td style="background-color: ${rowColor}; padding: ${padding}; border: ${border};">Wartość A${i}</td>`;
      tableHTML += `<td style="background-color: ${rowColor}; padding: ${padding}; border: ${border};">Wartość B${i}</td>`;
      tableHTML += `</tr>`;
    }

    tableHTML += "</tbody>";

    // Krok 3: Wstaw wygenerowany kod HTML do naszego elementu tabeli
    this.tableContainer.innerHTML = tableHTML;

    // Krok 4: Poinformuj Lookera, że skończyliśmy renderować wizualizację!
    done();
  }
});
