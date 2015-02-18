/**
 * Created by xdire on 16.02.15.
 *
 * XWF
 * Frames Framework for creating frames
 *
 * Usage:
 *
 * for create frame on callback of XHR:
 *
 * ---------------------------------------------
    XWF.connection({
        server:"test@test.com",
        serverMethod:"url",
        queryObject:{
          query:"test", type:"value"
        },
        queryData:{
          user:1, userkey:"xxx", ident:1
        }
    });
 * ----------------------------------------------
 */

(function(){

    var $cine = function(){return new FB();};

    var $apiVars = {
        success:"success",
        result:"result",
        error:"error",
        errorMessage:"error_msg",
        notify:"notify",
        notifyMessage:"notify_msg",
        notifyTimer:"notify_time"
    };

    var FB = function()
    {
        this.connServer = null;
        this.connServerMethod = null;
        this.connQueryObject = null;
        this.connQueryData = null;
        this.connQueryMethod = null;
        this.connNotify = null;
        this.connRepeatError = null;

        this.userId = null;
        this.userKey = null;

        this.titleField=null;

        this.privateConnIterator=null;
        this.privateConnPendingRequests=[];
        this.privateConnResultUrl=null;

        this.privateViewLoadingOverlay=null;
        this.privateViewQueue=[];

        this.connection = function(val){

            XWF.connServer = (val.hasOwnProperty('server'))?val['server']:XWF.connServer;
            XWF.connServerMethod = (val.hasOwnProperty('serverMethod'))?val['serverMethod']:XWF.connServerMethod;
            XWF.connQueryObject = (val.hasOwnProperty('queryObject'))?val['queryObject']:XWF.connQueryObject;
            XWF.connQueryData = (val.hasOwnProperty('queryData'))?val['queryData']:XWF.connQueryData;
            XWF.connQueryMethod = (val.hasOwnProperty('queryMethod'))?val['queryMethod']:XWF.connQueryMethod;
            XWF.connNotify = (val.hasOwnProperty('notify'))?val['notify']:XWF.connNotify;
            XWF.connRepeatError = (val.hasOwnProperty('repeatOnError'))?val['repeatOnError']:XWF.connRepeatError;

            XWF.userId = (val.hasOwnProperty('userId'))?val['userId']:XWF.userId;
            XWF.userKey = (val.hasOwnProperty('userId'))?val['userId']:XWF.userKey;

            XWF.titleField = (val.hasOwnProperty('titleId'))?val['titleId']:XWF.titleField;

        };

        this.send = function(val){

            var reqBackBar=(val.hasOwnProperty('navigationBar'))?val['navigationBar']:true;
            var reqUserKey=(val.hasOwnProperty('sendUserKey'))?val['sendUserKey']:false;
            var reqChangeTitle=(val.hasOwnProperty('changeTitle'))?val['changeTitle']:false;
            var reqEventReturn=(val.hasOwnProperty('returnData'))?val['returnData']:true;
            var reqEventWindow=(val.hasOwnProperty('raiseWindow'))?val['raiseWindow']:false;
            var reqEventWindowID=(val.hasOwnProperty('raiseWindowID'))?val['raiseWindowID']:false;
            var reqEventWaitCB=(val.hasOwnProperty('waitCallback'))?val['waitCallback']:false;
            var reqEventComplete=(val.hasOwnProperty('onComplete'))?val['onComplete']:null;
            var reqRepeatOnError=(val.hasOwnProperty('repeatOnError'))?val['repeatOnError']:false;
            var reqDisableInit=(val.hasOwnProperty('disableInitiator'))?val['disableInitiator']:false;

            if(XWF.connServerMethod=='url')
                XWF.privateConnResultUrl=XWF.connServer+'?'+FBObjectToPost(XWF.connQueryObject);

            if(reqEventWaitCB){
                FBAppendLoadingOverlay();
            }

            if (window.XMLHttpRequest) {
                var xhr = new XMLHttpRequest();
                FBXHRPostData( xhr, XWF.privateConnResultUrl, XWF.connQueryData, function(response)
                {

                    var window=null;
                    var result={window:null,content:null,title:null,data:null};

                    // Define is event need to return data to next functions
                    if(reqEventReturn){
                        result['data']=FBXHRCallbackResponse(response);
                    }

                    // Raise Window Procedure Requested
                    if(reqEventWindow){

                        window=FBOpenWindowView({raiseWindowID:reqEventWindowID});
                        result['window']=window['frame'];
                        result['content']=window['content'];
                        result['title']=window['title'];

                        if(XWF.privateViewLoadingOverlay!=null){
                            XWF.privateViewLoadingOverlay.parentNode.removeChild(XWF.privateViewLoadingOverlay);
                            XWF.privateViewLoadingOverlay=null;
                        }

                    }

                    // Execute onComplete function
                    if(typeof reqEventComplete==='function'){
                        reqEventComplete(result);
                    }

                },false);
            }
        };

        this.openwindow = function(val){

            FBOpenWindowView(val);

        };

    };

    function FBXHRCallbackResponse(data){

        var obj = null;

        var error=false;
        var ernum=0;

        try {
            data = JSON.parse(data);
        } catch (e) {
            data = null;
        }

        if(data!=null){

            if (!data[$apiVars.result] && data[$apiVars.error] > 0) {

                error=true;
                ernum=data[$apiVars.error];

            }
            if(data[$apiVars.notify]){
                if($apiVars.notifyTimer in data){
                    FBNotify({message:data[$apiVars.notifyMessage],destroy:data[$apiVars.notifyTimer]});
                } else {
                    FBNotify({message:data[$apiVars.notifyMessage]});
                }
            }

            //console.log(data);
            return data;
        }

    }

    function FBOpenWindowView(values){

        var window,content,title;


        return {frame:window,content:content,title:title};

    }

    function FBAppendLoadingOverlay(){

        var scr = document.createElement('div');
        scr.className = 'xwf_loadingOverlay';

        scr.style.cssText = "position:absolute; top:0; left:0; z-index:9999; width:100%; height:100%; background-color:rgba(20,20,20,0.2)";
        document.body.appendChild(scr);
        XWF.privateViewLoadingOverlay=scr;

    }

    function FBXHRPostData(xhr,url,data,callback,ival){

        var timeout=null;

        if(XWF.connServer != null){

            var type = (XWF.connQueryMethod!=null)?XWF.connQueryMethod.toUpperCase():'POST';
            if(type=='POST' || type=='UPDATE' || type=='DELETE')
            {

                xhr.open(type,url,true);
                xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                xhr.setRequestHeader("X-Requested-With","XMLHttpRequest");

                // Timeout counter
                timeout=setTimeout(function(){console.log(' + --- XHR REQUEST TIMED OUT '); xhr.abort(); clearInterval(ival);}.bind(xhr),3000);

                xhr.onreadystatechange = function()
                {
                    if (xhr.readyState == 4 && xhr.status == 200)
                    {
                        if(xhr.status == 200)
                        {
                            // Clear timers
                            clearInterval(ival);
                            clearTimeout(timeout);
                            XWF.privateConnIterator=null;
                            callback(xhr.responseText);
                        }
                        else
                        {
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
                        if (XWF.privateConnIterator == null)
                            FBNotify({message: 'Internet connection lost, you can resume after it will restore'});
                        //delete xhr;
                        // Clear timeout
                        clearTimeout(timeout);
                        xhr.abort();
                        var nxhr = new XMLHttpRequest();
                        var inval;
                        if(!arrayIndex(XWF.privateConnPendingRequests,url))
                        {
                            inval = setInterval(function(){
                                FBXHRPostData(nxhr,url,data,callback,inval);
                            },5000);
                            XWF.privateConnPendingRequests.push(url);
                            XWF.privateConnIterator=1;
                        }

                    };
                }

                if(typeof data === 'object')
                    data = FBObjectToPost(data,'ajax');
                xhr.send(data);

            }

        }

    }

    function FBObjectToPost(data)
    {
        var r = [];
        for (var k in data) {
            if(data.hasOwnProperty(k)) {
                r.push(encodeURIComponent(k) + '=' + encodeURIComponent(data[k]));
            }
        }
        return r.join('&');
    }

    function FBNotify(obj){

    }

    function arrayIndex(a,e){
       var l= a.length;for(var i=0;i<l;i++){if(this[i]===e)return {result:true,pos:i}}return false;
    }

    if(!window.XWF){window.XWF = $cine();}
})();