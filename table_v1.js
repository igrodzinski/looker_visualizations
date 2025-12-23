looker.plugins.visualizations.add({
  id: "table_v1",
  label: "table_v1",

  // 1. TU DEFINIUJESZ OPCJE DLA UŻYTKOWNIKA
  options: {
    font_size: {
      type: "string",
      label: "Rozmiar czcionki",
      display: "select",
      values: [
        {"Mała": "24px"},
        {"Średnia": "36px"},
        {"Duża": "72px"}
      ],
      default: "36px"
    }
  },

  create: function(element, config) {
    element.innerHTML = "";
    var container = element.appendChild(document.createElement("div"));
    container.className = "hello-world-container";
    // Styl podstawowy
    container.style.fontFamily = "Arial";
    container.style.textAlign = "center";
    container.style.marginTop = "20px";
    this._textElement = container;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();
    if (data.length == 0) {
      this.addError({title: "Brak danych", message: "Brak wyników."});
      return;
    }

    // 2. TU ODCZYTUJESZ WYBÓR UŻYTKOWNIKA (config.font_size)
    // Jeśli użytkownik nic nie wybrał, używamy wartości domyślnej
    var fontSize = config.font_size || this.options.font_size.default;
    
    // 3. APLIKUJESZ STYL
    this._textElement.style.fontSize = fontSize;

    var firstRow = data[0];
    var firstCell = firstRow[queryResponse.fields.dimensions[0].name];
    this._textElement.innerHTML = LookerCharts.Utils.htmlForCell(firstCell);

    done();
  }
});
