/***

  Unemployment card

***/

let unemployCard

d3.csv('/data/Economy/processed/unemployment_quarterly_dublin.csv')
.then(unemploymentData => {
  const unemploymentColumnNames = unemploymentData.columns.slice(2)
  const unemploymentColumnName = unemploymentColumnNames[0]
  const unemploymentDataSet = coerceData(unemploymentData, unemploymentColumnNames)
  // console.log(unemploymentDataSet)
  // const dublinData = unemploymentDataSet.filter(d => {
  //   return !isNaN(d[unemploymentColumnName])
  // })
  unemploymentDataSet.forEach(d => {
    d.quarter = convertQuarter(d.quarter)
    d.label = formatQuarter(d.quarter)
    d[unemploymentColumnName] = parseFloat(d[unemploymentColumnName]) * 1000
  })
  // configuration object
  const unemploymentConfig = {
    d: unemploymentDataSet,
    e: '#unemployment-chart',
    yV: unemploymentColumnName,
    xV: 'quarter',
    // sN: 'region',
    // fV: d3.format('.2s'),
    dL: 'label'
  }
  unemployCard = new CardLineChart(unemploymentConfig)

  let info = getInfoText('#employment-card a', 'Unemployment in Dublin for ', ' on the previous quarter', unemploymentDataSet, unemploymentColumnName, 'label', d3.format(''), true)

  d3.select('#employment-card')
    .select('#card-info-text')
    .html('<p>' + info + '</p>')
}).catch(e => {
  console.log('Error in property price card')
  console.log(e)
})
