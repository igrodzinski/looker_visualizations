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

        allFields.forEach(field => {
            const fieldName = field.name;
            const fieldLabel = field.label_short || field.label;

            dynamicOptions[`${fieldName}_label`] = {
                section: fieldLabel,
                type: "string",
                label: "Label",
                display: "text",
                default: fieldLabel,
            };

            dynamicOptions[`${fieldName}_width`] = {
                section: fieldLabel,
                type: "string",
                label: "Width (e.g. 150px)",
                display: "text",
                default: "auto",
            };

            dynamicOptions[`${fieldName}_color`] = {
                section: fieldLabel,
                type: "string",
                label: "Text Color",
                display: "color",
                default: "#000000",
            };

            dynamicOptions[`${fieldName}_bg_color`] = {
                section: fieldLabel,
                type: "string",
                label: "Background Color",
                display: "color",
                default: "#ffffff",
            };

            dynamicOptions[`${fieldName}_text_align`] = {
                section: fieldLabel,
                type: "string",
                label: "Text Alignment",
                display: "select",
                values: [
                    {"Left": "left"},
                    {"Center": "center"},
                    {"Right": "right"}
                ],
                default: "left",
            };

            dynamicOptions[`${fieldName}_is_bold`] = {
                section: fieldLabel,
                type: "boolean",
                label: "Bold",
                default: false,
            };

            dynamicOptions[`${fieldName}_padding`] = {
                section: fieldLabel,
                type: "string",
                label: "Padding (e.g. 8px 12px)",
                display: "text",
                default: "8px",
            };
        });

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
            const padding = config[`${field.name}_padding`] || "8px";

            const cellStyle = `width: ${customWidth}; color: ${customColor}; background-color: ${bgColor}; font-weight: ${isBold}; text-align: ${align}; padding: ${padding};`;

            html += `<th class="${field.name}" style="${cellStyle}">${label}</th>`;
        });
        html += '</tr></thead><tbody>';

        // Build Table Rows
        data.forEach((row, i) => {
            html += '<tr>';

            // Add Row Number Cell
            if (config.show_row_numbers) {
                html += `<td class="row-number-cell">${i + 1}</td>`;
            }

            allFields.forEach(field => {
                const cell = row[field.name];
                const displayValue = (cell.html) ? cell.html : (cell.value_formatted || cell.value);
                
                const customWidth = config[`${field.name}_width`] || "auto";
                const customColor = config[`${field.name}_color`] || "#000000";
                const bgColor = config[`${field.name}_bg_color`] || "#ffffff";
                const isBold = config[`${field.name}_is_bold`] ? "bold" : "normal";
                const align = config[`${field.name}_text_align`] || "left";
                const padding = config[`${field.name}_padding`] || "8px";

                const cellStyle = `width: ${customWidth}; color: ${customColor}; background-color: ${bgColor}; font-weight: ${isBold}; text-align: ${align}; padding: ${padding};`;

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
