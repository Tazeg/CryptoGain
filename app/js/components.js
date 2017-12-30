//------------------------------------------------------------------------------
// Twitter : @JeffProd
// Web     : https://jeffprod.com
// Mail    : jeffprod - protonmail
// LICENSE : MIT
//------------------------------------------------------------------------------

'use strict';

const Chart = require('chart.js');

/**
 * Composant VueJS : line chart
 * @example
 * <mychart :chartData="chartData" :chartTitle="title"></mychart>
 * @property chartData {Object} : {labels: [...], values: [...]}
 */

let mychart = {
    data: function() {
        return {
            id: 'mychart'+this._uid,
            myChartFreq: null
            };
        },
    props: ['chartData', 'chartTitle'],
    template: `
<Card v-bind:style="{display: chartData.values.length>0?'':'none', width: '100%'}">
    <canvas :id="id" height="100"></canvas>
</Card>
`,
    mounted: function () {
        //console.log('CHART mounted');
        this.render();
        },
    watch: {
        /**
         * Render graph when chartData is updated
         */
        chartData: function () {
            this.render();
            } // watch chartData
        },
    methods: {
        render: function () {
            //console.time('chartrender');
            if(this.myChartFreq) {
                this.myChartFreq.destroy();
                }
            if(this.chartData.values.length===0) {
                return;
                }
            this.myChartFreq = new Chart(this.id, {
                options: {
                    tooltips: { // hide chart title in tooltip
                        callbacks: {
                            label: function(tooltipItem) {
                                return tooltipItem.yLabel;
                                }
                            }
                        }
                    },
                type: 'line',
                data: {
                    labels: this.chartData.labels,
                    datasets: [{
                        label: this.chartTitle,
                        backgroundColor: '#36a2eb',
                        borderColor: '#36a2eb',
                        data: this.chartData.values,
                        fill: false
                        }]
                    } // data
                }); // new Chart
            //console.timeEnd('chartrender'); // 1000 tweets, 5 essais, moy:476ms
            }, // render
        } // methods
    };

exports.mychart = mychart;
