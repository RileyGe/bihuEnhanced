Vue.config.devtools = true;
let server = 'http://123.206.196.207/timeBase/';
new Vue({
    el: '#app',
    data: function() {
        return {
            toModifyTiming: {
                bihuId: '',
                proveArticleId: ''
            },
            toDelTiming: {
                bihuId: '',
                proveArticleId: '',
                pk: ''
            },           
            timings: {
                results: []
            },
            modifyDialogVisible: false,
            delDialogVisible: false,
            loadingTable: false,
            loadingMain: false,
            input4Query: null,
            fromServerVList: null,
            queryItem: null,
            queryItems: [{
                label: '币乎Id',
                value: 'bihuId'
            }, {
                label: '作者名',
                value: 'bihuName'
            }],
            newDialogVisible: false,
            newData: {
                bihuId: '',
                proveArticleId: ''
            }
        }
    },
    mounted: function() {
        var that = this;
        this.loadingTable = true;
        chrome.runtime.sendMessage({
            method: "getServerVList"
        }, function(response) {
            that.fromServerVList = new Set(response.vlist);

            axios
                .get(server + 'TimingRecord/')
                .then(response => {
                    that.timings = response.data;
                    that.findServerList();
                    that.loadingTable = false
                })
                .catch(err => (that.loadingTable = false))
        });



    },
    methods: {
        getNext: function() {
            var that = this;
            axios
                .get(that.timings.next)
                .then(response => {
                    that.timings = response.data;
                    that.findServerList();
                    that.loadingTable = false
                })
                .catch(err => (that.loadingTable = false));
            window.scroll(0, 0);

        },
        getPre: function() {
            var that = this;
            axios
                .get(that.timings.previous)
                .then(response => {
                    that.timings = response.data;
                    that.findServerList();
                    that.loadingTable = false
                })
                .catch(err => (that.loadingTable = false));
            window.scroll(0, 0);
        },
        beforeDelTiming: function(data){
            this.toDelTiming.proveArticleId = '';
            this.toDelTiming.bihuId = data.bihuId;
            this.toDelTiming.pk = data.pk;
            this.delDialogVisible = true;
        },
        beforeModifyTiming: function(data) {
            this.toModifyTiming = data;
            this.toModifyTiming.proveArticleId = '';
            this.modifyDialogVisible = true;
        },
        delTiming: function(){
            var that =this;
            if (!/^\d+$/.test(that.toDelTiming.proveArticleId)) {
                that.$message({
                    message: '验证文章Id输入错误',
                    type: 'warning'
                });
                return;
            }

            that.delDialogVisible = false;
            that.loadingMain = true;
            axios
                .post(server + 'deleteTiming/', {
                    bihuId: that.toDelTiming.bihuId,
                    proveArticleId: that.toDelTiming.proveArticleId,
                    pk: that.toDelTiming.pk
                })
                .then(response => {

                    that.$message({
                        message: '删除成功',
                        type: 'success'
                    });
                    that.timings ={results:[]};
                    that.loadingMain = false;
                })
                .catch(err => {
                    that.loadingMain = false;
                    if (err.response.data.message) {
                        that.$message({
                            message: err.response.data.message,
                            type: 'error'
                        });
                    }
                })


        },
        modifyTiming: function() {
            var that = this;
            if (!/^\d+$/.test(that.toModifyTiming.proveArticleId)) {
                that.$message({
                    message: '验证文章Id输入错误',
                    type: 'warning'
                });
                return;
            }
            that.modifyDialogVisible = false;
            that.loadingMain = true;
            axios
                .put(server + 'TimingRecord/'+that.toModifyTiming.pk + '/', {
                    bihuId: that.toModifyTiming.bihuId,
                    proveArticleId: that.toModifyTiming.proveArticleId
                })
                .then(response => {

                    that.$message({
                        message: '修改成功',
                        type: 'success'
                    });
                    that.input4Query = that.toModifyTiming.bihuId;
                    that.queryItem = 'bihuId';
                    that.query();
                    //that.timings ={results:[response.data]};
                    //that.findServerList();
                    that.loadingMain = false;
                })
                .catch(err => {
                    that.loadingMain = false;
                    if (err.response.data.message) {
                        that.$message({
                            message: err.response.data.message,
                            type: 'error'
                        });
                    }
                })



        },
        findServerList: function() {
            for (var i in this.timings.results) {
                if (this.fromServerVList.has(parseInt(this.timings.results[i].bihuId))) {
                    this.timings.results[i].fromServer = true;
                }
            }
        },
        tableRowClassName: function({
            row,
            rowIndex
        }) {

            // if (this.fromServerVList.has(parseInt(row.bihuId))) {
            //     return 'success-row';
            // }
            // return '';
            if (row.fromServer) {
                return 'success-row';
            }
            return '';
        },

        addToLocal: function(row, scope) {
            var that = this;
            var data = {
                bigVHour: row.publishTime.substr(0, 2),
                bigVMinute: row.publishTime.substr(3, 2),
                bigVId: row.bihuId,
                bigVName: row.bihuName,
                fromServer: true,
                publishWeekday: row.publishWeekday
            }
            chrome.runtime.sendMessage({
                method: "addBigV",
                data: data
            }, function(response) {
                if (response.success) {
                    //console.log(response);
                    that.$message({
                        message: '添加成功，请点击右上角插件图标查看',
                        type: 'success'
                    });

                    that.fromServerVList.add(row.bihuId);
                    for (var i in that.timings.results) {
                        if (parseInt(that.timings.results[i].bihuId) == parseInt(row.bihuId)) {

                            that.timings.results[i].fromServer = true;
                            that.timings.results[i].bihuName += ' ';
                        }
                    }
                    axios
                        .post(server + 'voteTiming/', {
                            bihuId: row.bihuId,
                            pk: row.pk
                            //fromBihuId: that.newData.proveArticleId
                        }).then({});
                    /**
                    var tmp = that.timings;
                    that.timings = [];
                    that.$nextTick(function() {
                        that.timings = tmp;
                        //that.$forceUpdate();
                    })
                    */



                }
            });

        },
        addNew: function() {
            var that = this;
            if (!that.newData.bihuId || !that.newData.proveArticleId) {
                that.$message({
                    message: '请补全信息',
                    type: 'warning'
                });
                return;
            }
            if (!/^\d+$/.test(that.newData.bihuId)) {
                that.$message({
                    message: '币乎Id输入错误',
                    type: 'warning'
                });
                return;

            }
            if (!/^\d+$/.test(that.newData.proveArticleId)) {
                that.$message({
                    message: '验证文章Id输入错误',
                    type: 'warning'
                });
                return;
            }
            that.newDialogVisible = false;
            that.loadingMain = true;
            axios
                .post(server + 'TimingRecord/', {
                    bihuId: that.newData.bihuId,
                    proveArticleId: that.newData.proveArticleId
                })
                .then(response => {

                    that.$message({
                        message: '增加成功',
                        type: 'success'
                    });
                    that.timings ={results:[ response.data]};
                    that.findServerList();
                    that.loadingMain = false;
                })
                .catch(err => {
                    that.loadingMain = false;
                    if (err.response.data.message) {
                        that.$message({
                            message: err.response.data.message,
                            type: 'error'
                        });
                    }
                })


        },
        query: function() {
            var that = this;
            if (!that.queryItem) {
                that.$message({
                    message: '请先选择查询项目',
                    type: 'warning'
                });
                return;
            }
            if (that.input4Query && that.queryItem == 'bihuId' && !/^\d+$/.test(that.input4Query)) {
                that.$message({
                    message: 'id必须为纯数字',
                    type: 'warning'
                });
                return;
            }
            that.loadingTable = true;
            axios
                .get(server + 'TimingRecord/?' + that.queryItem + '=' + that.input4Query)
                .then(response => {
                    that.timings = response.data;
                    that.findServerList();
                    that.loadingTable = false
                })
                .catch(err => (that.loadingTable = false))

        }
    }
});