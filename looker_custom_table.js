looker.plugins.visualizations.add({
    id: "custom_table",
    label: "Custom Table with CSS",
    options: {
        show_row_numbers: {
            type: "boolean",
            label: "Show Row Numbers",
            default: true,
            order: 1
        },
        custom_css: {
            type: "string",
            label: "Custom CSS",
            display: "text",
            default: "",
            placeholder: "body { background-color: white; }",
            order: 2
        }
    },
    create: function (element, config) {
        element.innerHTML = `
      <style>
        .custom-table-container {
          width: 100%;
          height: 100%;
          overflow: auto;
          font-family: 'Open Sans', sans-serif;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
      </style>
      <div class="custom-table-container"></div>
    `;
        this._container = element.querySelector(".custom-table-container");
    },
    updateAsync: function (data, element, config, queryResponse, details, done) {
        this.clearErrors();

        if (queryResponse.fields.dimensions.length === 0) {
            this.addError({ title: "No Dimensions", message: "This chart requires dimensions." });
            return;
        }

        this._container.innerHTML = "<h1>Loading...</h1>";

        const dimensions = queryResponse.fields.dimensions;
        const measures = queryResponse.fields.measures;
        const allFields = [...dimensions, ...measures];

        // Generate dynamic options for each field
        let dynamicOptions = {
            show_row_numbers: {
                section: "General",
                type: "boolean",
                label: "Show Row Numbers",
                default: true,
                order: 1
            },
            custom_css: {
                section: "General",
                type: "string",
                label: "Custom CSS",
                display: "text",
                default: "",
                placeholder: "body { background-color: white; }",
                order: 2
            }
        };

        // Build column choices for the dropdown
        const columnChoices = [];
        allFields.forEach(field => {
            let choice = {};
            choice[field.label_short || field.label] = field.name;
            columnChoices.push(choice);
        });

        // Add the main selector option
        dynamicOptions.selected_column_to_edit = {
            section: "Seria",
            type: "string",
            label: "Wybierz kolumnę do edycji",
            display: "select",
            values: columnChoices,
            default: allFields[0] ? allFields[0].name : "",
            order: 1
        };

        // Determine the currently selected column
        const selectedColumnName = config.selected_column_to_edit || (allFields[0] ? allFields[0].name : null);

        // Generate options for ALL columns, but hide the ones not selected
        allFields.forEach(fieldObj => {
            const fieldName = fieldObj.name;
            const fieldLabel = fieldObj.label_short || fieldObj.label;
            const isHidden = fieldName !== selectedColumnName;

            dynamicOptions[`${fieldName}_label`] = {
                section: "Seria",
                type: "string",
                label: `Etykieta (${fieldLabel})`,
                display: "text",
                default: fieldLabel,
                hidden: isHidden,
                order: 2
            };

            dynamicOptions[`${fieldName}_width`] = {
                section: "Seria",
                type: "string",
                label: `Szerokość`,
                display: "text",
                default: "auto",
                hidden: isHidden,
                order: 3
            };

            dynamicOptions[`${fieldName}_color`] = {
                section: "Seria",
                type: "string",
                label: `Kolor Tekstu`,
                display: "color",
                default: "#000000",
                hidden: isHidden,
                order: 4
            };

            dynamicOptions[`${fieldName}_bg_color`] = {
                section: "Seria",
                type: "string",
                label: `Kolor Tła`,
                display: "color",
                default: "#ffffff",
                hidden: isHidden,
                order: 5
            };

            dynamicOptions[`${fieldName}_text_align`] = {
                section: "Seria",
                type: "string",
                label: `Wyrównanie Tekstu`,
                display: "select",
                values: [
                    {"Do lewej": "left"},
                    {"Środek": "center"},
                    {"Do prawej": "right"}
                ],
                default: "left",
                hidden: isHidden,
                order: 6
            };

            dynamicOptions[`${fieldName}_is_bold`] = {
                section: "Seria",
                type: "boolean",
                label: `Pogrubienie`,
                default: false,
                hidden: isHidden,
                order: 7
            };

            dynamicOptions[`${fieldName}_padding_top`] = {
                section: "Seria",
                type: "string",
                label: `Padding Górny`,
                display: "text",
                default: "8px",
                hidden: isHidden,
                order: 8
            };

            dynamicOptions[`${fieldName}_padding_right`] = {
                section: "Seria",
                type: "string",
                label: `Padding Prawy`,
                display: "text",
                default: "8px",
                hidden: isHidden,
                order: 9
            };

            dynamicOptions[`${fieldName}_padding_bottom`] = {
                section: "Seria",
                type: "string",
                label: `Padding Dolny`,
                display: "text",
                default: "8px",
                hidden: isHidden,
                order: 10
            };

            dynamicOptions[`${fieldName}_padding_left`] = {
                section: "Seria",
                type: "string",
                label: `Padding Lewy`,
                display: "text",
                default: "8px",
                hidden: isHidden,
                order: 11
            };
        });

        // Add Row Rule Options
        dynamicOptions.row_rule_column = {
            section: "Row",
            type: "string",
            label: "Kolumna warunku",
            display: "select",
            values: columnChoices,
            default: "",
            order: 100
        };
        dynamicOptions.row_rule_operator = {
            section: "Row",
            type: "string",
            label: "Operator warunku",
            display: "select",
            values: [
                {"Równe (=)": "=="},
                {"Różne od (!=)": "!="},
                {"Zawiera": "contains"}
            ],
            default: "==",
            order: 101
        };
        dynamicOptions.row_rule_value = {
            section: "Row",
            type: "string",
            label: "Wartość warunku",
            display: "text",
            default: "",
            order: 102
        };
        dynamicOptions.row_rule_color = {
            section: "Row",
            type: "string",
            label: "Kolor Tekstu",
            display: "color",
            default: "",
            order: 103
        };
        dynamicOptions.row_rule_bg_color = {
            section: "Row",
            type: "string",
            label: "Kolor Tła",
            display: "color",
            default: "",
            order: 104
        };
        dynamicOptions.row_rule_text_align = {
            section: "Row",
            type: "string",
            label: "Wyrównanie Tekstu",
            display: "select",
            values: [
                {"Domyślne": ""},
                {"Do lewej": "left"},
                {"Środek": "center"},
                {"Do prawej": "right"}
            ],
            default: "",
            order: 105
        };
        dynamicOptions.row_rule_is_bold = {
            section: "Row",
            type: "boolean",
            label: "Pogrubienie",
            default: false,
            order: 106
        };
        dynamicOptions.row_rule_padding_top = {
            section: "Row",
            type: "string",
            label: "Padding Górny",
            display: "text",
            default: "",
            order: 107
        };
        dynamicOptions.row_rule_padding_right = {
            section: "Row",
            type: "string",
            label: "Padding Prawy",
            display: "text",
            default: "",
            order: 108
        };
        dynamicOptions.row_rule_padding_bottom = {
            section: "Row",
            type: "string",
            label: "Padding Dolny",
            display: "text",
            default: "",
            order: 109
        };
        dynamicOptions.row_rule_padding_left = {
            section: "Row",
            type: "string",
            label: "Padding Lewy",
            display: "text",
            default: "",
            order: 110
        };

        // Register the dynamic options
        this.trigger('registerOptions', dynamicOptions);

        // Build Table Header
        let html = '<table><thead><tr>';

        // Add Row Numbers Header if needed
        if (config.show_row_numbers) {
            html += '<th class="row-number-header">#</th>';
        }

        allFields.forEach(field => {
            const label = config[`${field.name}_label`] !== undefined ? config[`${field.name}_label`] : (field.label_short || field.label);
            const customWidth = config[`${field.name}_width`] || "auto";
            const customColor = config[`${field.name}_color`] || "#000000";
            const bgColor = config[`${field.name}_bg_color`] || "#ffffff";
            const isBold = config[`${field.name}_is_bold`] ? "bold" : "normal";
            const align = config[`${field.name}_text_align`] || "left";
            const pt = config[`${field.name}_padding_top`] || "8px";
            const pr = config[`${field.name}_padding_right`] || "8px";
            const pb = config[`${field.name}_padding_bottom`] || "8px";
            const pl = config[`${field.name}_padding_left`] || "8px";

            const cellStyle = `width: ${customWidth}; color: ${customColor}; background-color: ${bgColor}; font-weight: ${isBold}; text-align: ${align}; padding: ${pt} ${pr} ${pb} ${pl};`;

            html += `<th class="${field.name}" style="${cellStyle}">${label}</th>`;
        });
        html += '</tr></thead><tbody>';

        // Build Table Rows
        data.forEach((row, i) => {
            html += '<tr>';

            // Evaluate Row Conditional Rule
            let isRowMatch = false;
            const ruleCol = config.row_rule_column;
            const ruleOp = config.row_rule_operator || "==";
            const ruleVal = config.row_rule_value;

            if (ruleCol && ruleVal !== undefined && ruleVal !== "") {
                const cellData = row[ruleCol];
                if (cellData) {
                    const cellValueStr = String(cellData.value || "").toLowerCase();
                    const targetValStr = String(ruleVal).toLowerCase();

                    if (ruleOp === "==" && cellValueStr === targetValStr) isRowMatch = true;
                    else if (ruleOp === "!=" && cellValueStr !== targetValStr) isRowMatch = true;
                    else if (ruleOp === "contains" && cellValueStr.includes(targetValStr)) isRowMatch = true;
                }
            }

            // Add Row Number Cell
            if (config.show_row_numbers) {
                html += `<td class="row-number-cell">${i + 1}</td>`;
            }

            allFields.forEach(field => {
                const cell = row[field.name];
                const displayValue = (cell.html) ? cell.html : (cell.value_formatted || cell.value);
                
                const customWidth = config[`${field.name}_width`] || "auto";
                
                // Merge Column styles with Row Conditional Styles
                const customColor = (isRowMatch && config.row_rule_color) ? config.row_rule_color : (config[`${field.name}_color`] || "#000000");
                const bgColor = (isRowMatch && config.row_rule_bg_color) ? config.row_rule_bg_color : (config[`${field.name}_bg_color`] || "#ffffff");
                
                // For booleans and selects, check if row rule has a value
                const colBold = config[`${field.name}_is_bold`] ? "bold" : "normal";
                const rowBold = config.row_rule_is_bold ? "bold" : colBold;
                const isBold = isRowMatch ? rowBold : colBold;
                
                const colAlign = config[`${field.name}_text_align`] || "left";
                const isRowAlignSet = isRowMatch && config.row_rule_text_align && config.row_rule_text_align !== "";
                const align = isRowAlignSet ? config.row_rule_text_align : colAlign;
                
                const pt = (isRowMatch && config.row_rule_padding_top) ? config.row_rule_padding_top : (config[`${field.name}_padding_top`] || "8px");
                const pr = (isRowMatch && config.row_rule_padding_right) ? config.row_rule_padding_right : (config[`${field.name}_padding_right`] || "8px");
                const pb = (isRowMatch && config.row_rule_padding_bottom) ? config.row_rule_padding_bottom : (config[`${field.name}_padding_bottom`] || "8px");
                const pl = (isRowMatch && config.row_rule_padding_left) ? config.row_rule_padding_left : (config[`${field.name}_padding_left`] || "8px");

                const cellStyle = `width: ${customWidth}; color: ${customColor}; background-color: ${bgColor}; font-weight: ${isBold}; text-align: ${align}; padding: ${pt} ${pr} ${pb} ${pl};`;

                html += `<td class="${field.name}" style="${cellStyle}">${displayValue}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        this._container.innerHTML = html;

        // Apply some base styles
        if (config.custom_css) {
            this._container.insertAdjacentHTML('beforeend', `<style>${config.custom_css}</style>`);
        }
    }
});
