looker.plugins.visualizations.add({
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker
    id: "xkcd",
    label: "XKCD",
    options: {
      chart_type: {
        type: "string",
        label: "Chart type",
        values: [
          {"Bar": "Bar"},
          {"Line": "Line"},
          {"Pie": "Pie"}
        ],
        display: "radio",
        default: "Bar"
      }
    },
    // Set up the initial state of the visualization
    create: function(element, config) {
  
      // Insert a <style> tag with some styles we'll use later.
    },
    // Render in response to the data or settings changing
    updateAsync: function(data, element, config, queryResponse, details, done) {
      element.innerHTML = `<svg id="chart"></svg>`;
  
      const svg = document.querySelector('#chart')
      const dim = queryResponse.fields.dimensions[0].name
      const meas = queryResponse.fields.measures[0].name
      const options = {
        data: {
          labels: data.map((d)=> {
            let label = ""
            queryResponse.fields.dimensions.forEach((dim) => label += ` ${d[dim.name].value}`)
            return label
          }),
          datasets: queryResponse.fields.measures.map((m) => {
            return {
              data: data.map((d) => d[m.name].value)
            }
          }),
      }}
      console.log(options)
      new chartXkcd[config.chart_type || "Bar"](svg, options);
  
      done()
    }});
