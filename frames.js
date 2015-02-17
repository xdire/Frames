/**
 * Created by xdire on 16.02.15.
 *
 * XWF
 * Frames Framework for creating frames
 *
 * Usage:
 *
 * xwf.connection = {
 *      server:"test@test.com",
 *      serverMethod:"url",
 *      queryObject:{
 *          param:"value",
 *          param2:"value"
 *         }
 *      queryData:{
 *          param:"value",
 *          param:"value"
 *         }
 *      };
 */

(function(){

    var $cine = function(){return new fBox();};

    var fBox = function()
    {

        this.connIterator=null;
        this.connPendingRequests=[];

        this.resultUrl=null;

        this.connServer = null;
        this.connServerMethod = null;
        this.connQueryObject = null;
        this.connQueryData = null;
        this.connQueryMethod = null;
        this.connNotify = null;
        this.connRepeatError = null;

        var connection = function(val){

            Xwf.connServer = (val.hasOwnProperty('server'))?val['server']:Xwf.connServer;
            Xwf.connServerMethod = (val.hasOwnProperty('serverMethod'))?val['serverMethod']:Xwf.connServerMethod;
            Xwf.connQueryObject = (val.hasOwnProperty('queryObject'))?val['queryObject']:Xwf.connQueryObject;
            Xwf.connQueryData = (val.hasOwnProperty('queryData'))?val['queryData']:Xwf.connQueryData;
            Xwf.connQueryMethod = (val.hasOwnProperty('queryMethod'))?val['queryMethod']:Xwf.connQueryMethod;
            Xwf.connNotify = (val.hasOwnProperty('notify'))?val['notify']:Xwf.connNotify;
            Xwf.connRepeatError = (val.hasOwnProperty('repeatOnError'))?val['repeatOnError']:Xwf.connRepeatError;

        }

    };


    function fBoxInitXHR(){
        var xhr = false;
        if (window.XMLHttpRequest){
            xhr = new XMLHttpRequest();
        } return xhr;
    }

    function fBoxXHRPostData(xhr,url,data,callback,ival){

        if(Xwf.connServer != null){

            type = (Xwf.connQueryMethod!=null)?Xwf.connQueryMethod.toUpperCase():'POST';
            if(type=='POST' || type=='UPDATE' || type=='DELETE')
            {

                xhr.open(type,url,true);
                xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                xhr.setRequestHeader("X-Requested-With","XMLHttpRequest");

                xhr.onreadystatechange = function()
                {
                    if (xhr.readyState == 4 && xhr.status == 200){
                        if(xhr.status == 200){
                            clearInterval(ival);
                            Xwf.connIterator=null;
                            callback(xhr.responseText);
                        }
                        else {
                            if (xhr.status === 404) {
                                callback('{"notify":true,"notify_msg":"Requested data cannot be found","notify_time":"5"}');
                            } else if (xhr.status === 500) {
                                callback('{"notify":true,"notify_msg":"Requested data encounter server error","notify_time":"5"}');
                            } else {
                                callback('{"notify":true,"notify_msg":"Connection to server is unavailable","notify_time":"5"}');
                            }
                        }
                    }
                };

                if(ival==false)
                {
                    xhr.onerror = function () {
                        //if (Xwf.connIterator == null)
                        //    cineNotify({message: 'Internet connection lost, you can resume after it will restore'});
                        delete xhr;
                        var nxhr = new XMLHttpRequest();
                        var inval;
                        if(!arrayIndex(Xwf.connPendingRequests,url))
                        {
                            inval = setInterval(function(){
                                fBoxXHRPostData(nxhr,url,data,callback,inval);
                            },5000);
                            Xwf.connPendingRequests.push(url);
                        }

                    };
                }

                if(typeof data === 'object')
                    data = fBoxObjectToPost(data,'ajax');
                xhr.send(data);

            }

        }

    }

    function fBoxExecuteAjaxQuery(type,url,data,event)
    {
        if(type=='post')
        {
            var a=fBoxInitXHR();
            return (a)?fBoxXHRPostData(a,url,data,event):false;
        }
    }

    function fBoxObjectToPost(data,qtype)
    {
        var r = [];
        for (var k in data) {
            if(data.hasOwnProperty(k)) {
                r.push(encodeURIComponent(k) + '=' + encodeURIComponent(data[k]));
            }
        }
        r.push('query_type='+qtype);
        return r.join('&');
    }

    function arrayIndex(a,e){
       var l= a.length;for(var i=0;i<l;i++){if(this[i]===e)return {result:true,pos:i}}return false;
    }
    if(!window.Xwf){window.Xwf = $cine();}
});