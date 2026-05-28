import React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import {
  ComponentsProvider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell
} from '@looker/components';

// Theme styling wrapper
const StyledTableWrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  font-family: 'Open Sans', sans-serif;

  table {
    width: 100%;
    border-collapse: collapse;
  }

  ${props => {
    switch (props.tableStyle) {
      case 'silver':
        return `
          table { border: 1px solid #dcdcdc; }
          th {
            background-color: #f5f5f5 !important;
            color: #4a4a4a !important;
            border-bottom: 2px solid #dcdcdc !important;
          }
          tr:nth-child(even) td { background-color: #fafafa !important; }
          td { border-bottom: 1px solid #e5e5e5 !important; }
        `;
      case 'blue':
        return `
          table { border: 1px solid #b3d1ff; }
          th {
            background-color: #1a73e8 !important;
            color: #ffffff !important;
            border-bottom: 2px solid #0052cc !important;
            font-weight: 600 !important;
          }
          tr:nth-child(even) td { background-color: #f2f7ff !important; }
          td { border-bottom: 1px solid #d9e8ff !important; }
        `;
      case 'dark':
        return `
          background-color: #121212 !important;
          color: #e0e0e0 !important;
          table {
            background-color: #1e1e1e !important;
            border: 1px solid #333333;
          }
          th {
            background-color: #2c2c2c !important;
            color: #ffffff !important;
            border-bottom: 2px solid #444444 !important;
          }
          tr:nth-child(even) td { background-color: #252525 !important; }
          td {
            color: #e0e0e0 !important;
            border-bottom: 1px solid #333333 !important;
            background-color: #1e1e1e !important;
          }
        `;
      case 'glassmorphism':
        return `
          background: rgba(255, 255, 255, 0.4) !important;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          table {
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: rgba(255, 255, 255, 0.2) !important;
          }
          th {
            background: rgba(255, 255, 255, 0.3) !important;
            color: #333333 !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.3) !important;
            backdrop-filter: blur(4px);
          }
          tr:nth-child(even) td { background: rgba(255, 255, 255, 0.15) !important; }
          td { border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important; }
        `;
      default:
        return '';
    }
  }}

  th {
    font-size: ${props => {
      switch (props.headerFontSize) {
        case 'small': return '12px !important;';
        case 'large': return '16px !important;';
        default: return '14px !important;';
      }
    }};
    ${props => props.headerTextColor ? `color: ${props.headerTextColor} !important;` : ''}
    ${props => props.headerBgColor ? `background-color: ${props.headerBgColor} !important;` : ''}
    ${props => props.truncateHeader ? `
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      max-width: 150px !important;
    ` : ''}
  }

  td {
    font-size: ${props => {
      switch (props.bodyFontSize) {
        case 'small': return '12px !important;';
        case 'large': return '16px !important;';
        default: return '14px !important;';
      }
    }};
  }
`;

function LookerUiTable({ data, queryResponse, config }) {
  const dimensions = queryResponse.fields.dimension_like || [];
  const measures = queryResponse.fields.measure_like || [];
  const allFields = dimensions.concat(measures);

  // Exclude hidden fields from rendering in the UI
  const visibleFields = allFields.filter(f => !f.hidden);

  // Apply row limit if configured
  let rowsToRender = data;
  if (config.limit_displayed_rows && config.limit_displayed_rows_values) {
    const limitVal = config.limit_displayed_rows_values.trim();
    if (/^\d+$/.test(limitVal)) {
      const limit = parseInt(limitVal, 10);
      rowsToRender = data.slice(0, limit);
    } else if (/^\d+-\d+$/.test(limitVal)) {
      const parts = limitVal.split('-');
      const start = Math.max(0, parseInt(parts[0], 10) - 1);
      const end = parseInt(parts[1], 10);
      rowsToRender = data.slice(start, end);
    }
  }

  return (
    <ComponentsProvider>
      <StyledTableWrapper
        tableStyle={config.table_style}
        headerFontSize={config.header_font_size}
        headerTextColor={config.header_text_color}
        headerBgColor={config.header_background_color}
        bodyFontSize={config.body_font_size}
        truncateHeader={config.truncate_header}
      >
        <Table>
          <TableHead>
            <TableRow>
              {config.show_row_numbers && <TableHeaderCell style={{ width: '50px' }}>#</TableHeaderCell>}
              {visibleFields.map(field => {
                const label = config.show_view_names
                  ? (field.label || field.name)
                  : (field.label_short || field.label || field.name);
                return (
                  <TableHeaderCell key={field.name}>
                    {label}
                  </TableHeaderCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {rowsToRender.map((row, i) => (
              <TableRow key={i}>
                {config.show_row_numbers && <TableCell>{i + 1}</TableCell>}
                {visibleFields.map(field => {
                  const cell = row[field.name];
                  if (!cell) return <TableCell key={field.name} />;

                  const val = cell.rendered || cell.value_formatted || cell.value;
                  if (cell.html) {
                    return (
                      <TableCell
                        key={field.name}
                        dangerouslySetInnerHTML={{ __html: cell.html }}
                      />
                    );
                  }
                  return (
                    <TableCell key={field.name}>
                      {val === null || val === undefined ? '' : String(val)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}

            {/* Totals row */}
            {config.show_totals && queryResponse.totals && (
              <TableRow style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                {config.show_row_numbers && <TableCell>Suma</TableCell>}
                {visibleFields.map((field, idx) => {
                  const totalCell = queryResponse.totals[field.name];
                  const fallbackLabel = (!config.show_row_numbers && idx === 0) ? 'Suma' : '';
                  
                  if (totalCell) {
                    const totalVal = totalCell.rendered || totalCell.value_formatted || totalCell.value;
                    if (totalCell.html) {
                      return (
                        <TableCell
                          key={field.name}
                          dangerouslySetInnerHTML={{ __html: totalCell.html }}
                        />
                      );
                    }
                    return (
                      <TableCell key={field.name}>
                        {totalVal === null || totalVal === undefined ? '' : String(totalVal)}
                      </TableCell>
                    );
                  }
                  return (
                    <TableCell key={field.name}>
                      {fallbackLabel}
                    </TableCell>
                  );
                })}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </StyledTableWrapper>
    </ComponentsProvider>
  );
}

looker.plugins.visualizations.add({
  id: "looker_ui_table",
  label: "Looker UI Table",
  options: {
    show_row_numbers: {
      type: "boolean",
      label: "Pokaż numery wierszy",
      default: true,
      section: "Tabela",
      order: 1
    },
    show_totals: {
      type: "boolean",
      label: "Pokaż sumy (Totals)",
      default: true,
      section: "Tabela",
      order: 2
    },
    show_row_totals: {
      type: "boolean",
      label: "Pokaż sumy wierszy",
      default: true,
      section: "Tabela",
      order: 3
    },
    show_view_names: {
      type: "boolean",
      label: "Pokaż pełną nazwę pola",
      default: true,
      section: "Tabela",
      order: 4
    },
    truncate_header: {
      type: "boolean",
      label: "Skróć nagłówki",
      default: false,
      section: "Tabela",
      order: 5
    },
    limit_displayed_rows: {
      type: "boolean",
      label: "Ogranicz wyświetlane wiersze",
      default: false,
      section: "Tabela",
      order: 6
    },
    limit_displayed_rows_values: {
      type: "string",
      label: "Zakres wyświetlanych wierszy (np. 10 lub 5-15)",
      default: "",
      display: "text",
      section: "Tabela",
      order: 7
    },
    header_font_size: {
      type: "string",
      label: "Rozmiar czcionki nagłówka",
      display: "select",
      values: [
        { "Mały": "small" },
        { "Średni": "medium" },
        { "Duży": "large" }
      ],
      default: "medium",
      section: "Nagłówek",
      order: 8
    },
    header_text_color: {
      type: "string",
      label: "Kolor tekstu nagłówka",
      display: "color",
      default: "#333333",
      section: "Nagłówek",
      order: 9
    },
    header_background_color: {
      type: "string",
      label: "Kolor tła nagłówka",
      display: "color",
      default: "#f0f0f0",
      section: "Nagłówek",
      order: 10
    },
    body_font_size: {
      type: "string",
      label: "Rozmiar czcionki tabeli",
      display: "select",
      values: [
        { "Mały": "small" },
        { "Średni": "medium" },
        { "Duży": "large" }
      ],
      default: "medium",
      section: "Tabela",
      order: 11
    },
    table_style: {
      type: "string",
      label: "Własny styl (wygląd)",
      display: "select",
      values: [
        { "Domyślny (Looker UI)": "default" },
        { "Srebrny (Sleek Silver)": "silver" },
        { "Niebieski (Classic Blue)": "blue" },
        { "Ciemny (Dark Mode)": "dark" },
        { "Glassmorphism": "glassmorphism" }
      ],
      default: "default",
      section: "Tabela",
      order: 12
    }
  },

  create: function(element, config) {
    this.container = element.appendChild(document.createElement("div"));
    this.container.style.width = "100%";
    this.container.style.height = "100%";
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    // Verification of fields
    const dimensions = queryResponse.fields.dimension_like || [];
    const measures = queryResponse.fields.measure_like || [];
    if (dimensions.length === 0 && measures.length === 0) {
      this.addError({
        title: "Brak pól",
        message: "Tabela wymaga co najmniej jednego wymiaru lub miary."
      });
      done();
      return;
    }

    try {
      ReactDOM.render(
        <LookerUiTable
          data={data}
          queryResponse={queryResponse}
          config={config}
        />,
        this.container
      );
      done();
    } catch (err) {
      this.addError({
        title: "Błąd renderowania",
        message: err.message
      });
      done();
    }
  }
});
