//------------------------------------------------------------------------------
// Twitter : @JeffProd
// Web     : https://jeffprod.com
// Mail    : jeffprod - protonmail
// LICENSE : MIT
//------------------------------------------------------------------------------

'use strict';

const iviewEN = require('iview/dist/locale/en-US'); 
const axios = require('axios');
const fs = require('fs');
const components = require('./js/components');
const { DateTime } = require('luxon');
const Datastore = require('nedb');
const electron = require('electron');
const remote = electron.remote;
const shell = electron.shell;
const app = remote.app;
const dialog = electron.remote.dialog;
const ipcRenderer = electron.ipcRenderer;

const mymenu = [
    {
        label: 'File',
        submenu: [{
            label: 'Add', click: function () {
                vue.selectCurrency = '';
                vue.invest = 0;
                vue.investgot = 0;
                vue.modalAdd = true;
            },
        },
        {
            label: 'Settings', click: function () {
                vue.modalSettings = true;
            },
        },
        {
            type: 'separator'
        },
        {
            label: 'Quit', click: function () {
            ipcRenderer.send('ipc-quit');
            },
            accelerator: 'Control+Q'
        }
        ] // submenu
    },
    {
        label: 'Help',
        submenu: [{
            label: 'About', click: function () {
                vue.modalAbout = true;
            }
        }] // submenu
    }
];

const updateInSecs = 300;
const menu = remote.Menu.buildFromTemplate(mymenu);
remote.Menu.setApplicationMenu(menu);
iview.locale(iviewEN.default);

let db = new Datastore({ filename: app.getPath('userData') + '/datafile', autoload: true });
let dbSettings = new Datastore({ filename: app.getPath('userData') + '/dbsettings', autoload: true });
let elapsed = updateInSecs;

let vue = new Vue({
    el: '#app',
    data: {
        versionSoft: app.getVersion(),
        chartData: {labels: [], values: []},
        changeCurrency: '',
        requestsToDo: 0,
        loading: false,
        errorMsg: '',
        rowToDelete: {},
        infoUpdate: '',
        devise: '$',
        modalAdd: false,
        modalSettings: false,
        modalAbout: false,
        modalDeleteRow: false,
        loading1: false,
        selectCurrency: '', // selected currency in modal
        options1: [],
        list: ['bitcoin', 'bitcoin-cash', 'cardano', 'dash', 'ethereum', 'golem-network-tokens', 'iota', 'litecoin', 'monero', 'nem', 'ripple', 'stellar', 'tron', 'zcash'],
        invest: 0,
        investTotal: 0,
        investgot:0,
        gainTotal: 0,
        columns: [
            {
                title: 'Currency',
                key: 'currency',
                fixed: 'left',
                width: 200,
                sortable: true,
                render: (h, params) => {
                    return h('div', [
                        h('img', {attrs: { src: 'img/'+params.row.currency+'.png', align: 'absmiddle', width: '24'}}),
                        h('span', {}, ' '+vue.ucfirst(params.row.currency)),
                    ]);
                }
            },{
                title: 'Balance',
                key: 'balance',
                sortable: true,
            },{
                title: 'Price',
                key: 'price',
                sortable: true,
            },{
                title: '1h %',
                key: 'change1h',
                sortable: true,
            },{
                title: '24h %',
                key: 'change24h',
                sortable: true,
            },{
                title: '7d %',
                key: 'change7d',
                sortable: true,
            },{
                title: 'Amount',
                key: 'amount',
                sortable: true,
            },{
                title: 'Invested',
                key: 'invested',
                sortable: true,
            },{
                title: 'Gain',
                key: 'gain',
                sortable: true
            }
        ],
        data: []
    },
    template: `
    <div>
    <br>
    <Row>
        <Col span="22" offset="1">
            <Table 
                :columns="columns" 
                :data="data" 
                v-if="data.length>0" 
                :loading="loading"
                @on-row-click="confirmDeleteRow"
            ></Table>
            <Alert show-icon v-else>Add a currency by menu File &gt; Add</Alert>
            <Alert type="error" show-icon closable v-if="errorMsg">{{ errorMsg }}</Alert>
        </Col>
    </Row>

    <!-- Chart -->
    <br>
    <Row v-if="chartData.labels.length>0">
        <Col span="17" offset="1">
            <mychart :chartData="chartData" :chartTitle="chartTitle"></mychart>
            <br>
            <div style="text-align: right;">
                <Button type="primary" icon="android-download" @click.native="downloadChartData">CSV</Button>
            </div> 
        </Col>
        <Col span="4" offset="1">
            <Card>
                <p slot="title">
                <Icon type="ios-pulse"></Icon>
                    Total
                </p>            
                Invested : {{ investTotal }} {{ devise }} <br>
                Value : {{ currentValue }} {{ devise }}<br>
                Gain : <b :style="{ color: gainTotal>=0?'#006400':'#FF0000' }">{{ gainTotal.toFixed(2) }}</b> {{ devise }}
            </Card>
        </Col>
    </Row>
    <br>

    <span style="position:fixed;bottom:0px;width:100%;z-index: 100; background-color: #e8e8e7">&nbsp;{{ infoUpdate }}</span>

    <!-- modal add currency -->
    <Modal
        v-model="modalAdd"
        title="Add a currency"
        @on-ok="addCurrency(selectCurrency, invest, investgot)">

        <Form label-position="top">
            <FormItem label="Type the crypto-currency">
                <Select
                    v-model="selectCurrency"
                    filterable
                    remote
                    :remote-method="remoteMethod1"
                    :loading="loading1">
                    <Option v-for="(option, index) in options1" :value="option" :key="index">{{option}}</Option>
                </Select>
            </FormItem>
            <FormItem label="How much did you invest ?">
                <InputNumber :max="100000000000" :min="0" v-model="invest" size="large"></InputNumber> {{ devise }}
            </FormItem>
            <FormItem label="How much crypto-currency value did you get ?">
                <InputNumber :max="100000000000" :min="0" v-model="investgot" size="large"></InputNumber>
            </FormItem>            
        </Form>
    </Modal>

    <!-- modal settings -->
    <Modal
        v-model="modalSettings"
        title="Settings"
        @on-ok="modalSettings=false">
        <Form label-position="top">
            <FormItem label="Currency">
                <Select v-model="changeCurrency" style="width:200px">
                    <Option v-for="item in [{label:'EUR', value: '€'}, {label: 'USD', value: '$'}]" :value="item.value" :key="item.value">{{ item.label }}</Option>
                </Select>
            </FormItem>
        </Form>
    </Modal>
    
    <!-- modal about -->
    <Modal
        v-model="modalAbout"
        title="About"
        >
        CryptoGain v{{ versionSoft }} by <a href="#" @click="openURL('https://jeffprod.com')">https://jeffprod.com</a>, is a simple desktop app to keep an eye on your crypto currencies.<br>
        <br>
        Follow <a href="#" @click="openURL('https://twitter.com/jeffprod')">@JeffProd</a> on Twitter.<br>
        Currencies data from <a href="#" @click="openURL('https://coinmarketcap.com')">https://coinmarketcap.com</a>.<br>
        Made with : electronjs, axios, chart.js, iview, luxon, nedb, vue.
        <div slot="footer">
            <Button @click="modalAbout=false">OK</Button>
        </div>
    </Modal>

    <!-- modal confirm delete row -->
    <Modal v-model="modalDeleteRow" width="360">
        <p slot="header" style="color:#f60;text-align:center">
            <Icon type="information-circled"></Icon>
            <span>Delete confirmation</span>
        </p>
        <div style="text-align:center">
            <p>Do you want to delete this row ?</p>
        </div>
        <div slot="footer">
            <Button type="error" size="large" long @click="deleteRow">Delete</Button>
        </div>
    </Modal>    
    
    </div>
    `,
    created: function() {
        dbSettings.find({}, function (err, docs) {
            if(err) {vue.errorMsg = err; return;}
            if(docs.length!==1) {vue.loadFromDB(); return;}
            if(docs[0].devise) {vue.devise = docs[0].devise;}            
            vue.loadFromDB();
            });        
        },

    watch: {
        changeCurrency: function(newval) {
            this.devise = newval;
            dbSettings.update({}, { $set: { devise: newval } }, { upsert: true }, function (err) {
                if(err) {vue.errorMsg = err; return;}
                });
            this.$Notice.open({
                title: 'Currency saved',
                desc: 'Please, restart the application.'
            });                
            }
        },

    computed: {
        chartTitle: function() {
            return 'Current gain : ' + this.gainTotal.toFixed(2) + ' ' + this.devise;
            },
        currentValue: function() {
            return (this.investTotal + this.gainTotal).toFixed(2);
            }
        },

    components: {
        'mychart': components.mychart
        },

    methods: {
        loadFromDB: function() {
            db.find({}, function (err, docs) {
                if(err) {vue.errorMsg = err; return;}
                docs.forEach(function(doc) {vue.data.push(doc);});
                vue.refreshTable();
                setInterval(function() {vue.refreshTable();}, updateInSecs*1000);
                setInterval(function() {vue.infoUpdate = 'Next update in ' + elapsed + ' seconds'; elapsed--;}, 1000);
                });
            }, // loadFromDB

        confirmDeleteRow: function(row) {
            this.modalDeleteRow = true;
            this.rowToDelete = row;
            }, // confirmDeleteRow

        deleteRow: function() {
            db.remove({currency: this.rowToDelete.currency}, {}, function (err) {
                if(err) {vue.errorMsg = 'err'; return;}
                for (let i in vue.data) {
                    if (vue.data[i].currency === vue.rowToDelete.currency) {
                        vue.data.splice(i, 1);
                        break;
                        }
                    }
                vue.refreshTable();  
                });
            this.modalDeleteRow = false;
            }, // deleteRow
        addCurrency: function(selectCurrency, invest, investgot) {
            if(!selectCurrency) {return;}
            investgot = parseFloat(investgot);
            if(investgot<=0) {return;}
            invest = parseFloat(invest);
            let doc = {
                currency: selectCurrency,
                balance: investgot,
                price: 0,
                change1h: 0,
                change24h: 0,
                change7d: 0,
                amount: 0,
                invested: invest,
                gain: 0
            };
            this.data.push(doc);
            db.insert(doc, function (err) {   // Callback is optional
                vue.errorMsg = err;
            });                
            this.refreshTable();
        }, // addCurrency

        /**
         * Get data from API to refresh table
         */
        refreshTable: function() {
            this.gainTotal = 0;
            this.investTotal = 0;
            this.requestsToDo = this.data.length;
            this.data.forEach(function(item) {
                vue.loading = true;
                let url = 'https://api.coinmarketcap.com/v1/ticker/'+item.currency;
                if(vue.devise==='€') {url += '/?convert=EUR';}
                axios.get(url)
                .then(function (response) {
                    vue.updateRow(item.currency, response.data[0]);
                    vue.loading = false;
                    })
                .catch(function (error) {
                    vue.errorMsg = error;
                    vue.loading = false;
                    });
                }); // forEach
            elapsed = updateInSecs;
            }, // refreshTable

        remoteMethod1: function(query) {
            if (query !== '') {
                this.loading1 = true;
                setTimeout(() => {
                    this.loading1 = false;
                    const list = this.list.map(item => {
                        return item;
                        });
                    this.options1 = list.filter(item => item.toLowerCase().indexOf(query.toLowerCase()) > -1);
                    }, 200);
                }
            else {
                this.options1 = [];
                }
            }, // remoteMethod1

        updateRow: function (currency, json) {
            for (let i in this.data) {
                if (this.data[i].currency == currency) {
                    let price = parseFloat(json.price_usd);
                    if(this.devise==='€') {price = parseFloat(json.price_eur);}
                    this.data[i].price = parseFloat(price.toFixed(4));
                    this.data[i].change1h = parseFloat(json.percent_change_1h);
                    this.data[i].change24h = parseFloat(json.percent_change_24h);
                    this.data[i].change7d = parseFloat(json.percent_change_7d);
                    let amount = this.data[i].balance * price;
                    this.data[i].amount = parseFloat(amount.toFixed(2));
                    let gain = parseFloat((amount - this.data[i].invested).toFixed(2));
                    this.data[i].gain = gain;
                    this.gainTotal += gain;
                    this.investTotal += this.data[i].invested;
                    this.requestsToDo--;
                    if(this.requestsToDo===0) {
                        this.chartData.labels.push(DateTime.local().toFormat('yyyy-MM-dd TT'));
                        this.chartData.values.push(this.gainTotal.toFixed(2));
                        this.chartData = {labels: this.chartData.labels, values: this.chartData.values};
                        }
                    break;
                    }
                } // for
            }, // updateRow

        ucfirst: function(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
            }, // ucfirst

        downloadChartData: function () {
            let title = 'Destination file';
            let outputFile = dialog.showSaveDialog({
                title: title,
                message: title,
                defaultPath: app.getPath('documents'),
                filters: [
                    {name: 'CSV', extensions: ['csv']}
                    ]
                });
            if(!outputFile) {return;}
            outputFile = outputFile.toString();

            let str = 'DateTime;Gain'+this.devise+'\n';
            for(let i=0; i<this.chartData.labels.length; i++) {
                str += this.chartData.labels[i] + ';' + this.chartData.values[i] + '\n';
                }

            fs.writeFile(outputFile, str, function(err) {
                if(err) {
                    vue.errorMsg = err;
                    return;
                    }
                }); // fs.writefile
            }, // downloadChartData

        openURL: function(url) {
            shell.openExternal(url);
            }

        } // methods
    }); // new Vue
