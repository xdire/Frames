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

        this.defaultContainer=null;

        this.defaultView = null;
        this.defaultHeaderHeight=76;
        this.defaultNavBarHeight=40;

        this.windowHeight=0;
        this.windowWidth=0;

        this.connServer = null;
        this.connServerMethod = null;
        this.connQueryObject = null;
        this.connQueryData = null;
        this.connQueryMethod = null;
        this.connNotify = null;
        this.connRepeatError = null;
        this.connOnError=null;
        this.connEarlyTermination=true;

        this.userId = null;
        this.userKey = null;

        this.titleField=null;

        this.privateConnIterator=null;
        this.privateConnPendingRequests=[];
        this.privateConnResultUrl=null;

        this.privateViewLoadingOverlay=null;
        this.privateViewQueue=[];
        this.privateViewCurrent=null;
        this.privateViewCurrentIndex=null;

        this.privateNotifications=null;

        this.sysRefreshWinContentOnScroll=false;
        this.sysRefreshWCTimer=null;

        if(this.windowHeight==0 || this.windowWidth==0){
            this.windowHeight=window.innerHeight;
            this.windowWidth=window.innerWidth;
        }

        this.init = function(){
            if(XWF.defaultContainer==null) {
                this.windowHeight=window.innerHeight;
                this.windowWidth=window.innerWidth;
            } else {
                var container=document.getElementById(XWF.defaultContainer);
                this.windowHeight=container.offsetHeight;
                this.windowWidth=container.offsetWidth;
            }
        };

        this.connection = function(val){

            XWF.connServer = (val.hasOwnProperty('server'))?val['server']:XWF.connServer;
            XWF.connServerMethod = (val.hasOwnProperty('serverMethod'))?val['serverMethod']:XWF.connServerMethod;
            XWF.connQueryObject = (val.hasOwnProperty('queryObject'))?val['queryObject']:XWF.connQueryObject;
            XWF.connQueryData = (val.hasOwnProperty('queryData'))?val['queryData']:XWF.connQueryData;
            XWF.connQueryMethod = (val.hasOwnProperty('queryMethod'))?val['queryMethod']:XWF.connQueryMethod;
            XWF.connNotify = (val.hasOwnProperty('notify'))?val['notify']:XWF.connNotify;
            XWF.connOnError = (val.hasOwnProperty('eventOnError'))?val['eventOnError']:XWF.connOnError;
            XWF.connRepeatError = (val.hasOwnProperty('repeatOnError'))?val['repeatOnError']:XWF.connRepeatError;

            XWF.userId = (val.hasOwnProperty('userId'))?val['userId']:XWF.userId;
            XWF.userKey = (val.hasOwnProperty('userId'))?val['userId']:XWF.userKey;

            XWF.titleField = (val.hasOwnProperty('titleId'))?val['titleId']:XWF.titleField;

        };

        this.send = function(val){

            var reqAddClass=(val.hasOwnProperty('windowClass'))?val['windowClass']:true;
            var reqBackBar=(val.hasOwnProperty('navigationBar'))?val['navigationBar']:true;
            var reqUserKey=(val.hasOwnProperty('sendUserKey'))?val['sendUserKey']:false;
            var reqChangeTitle=(val.hasOwnProperty('changeTitle'))?val['changeTitle']:false;
            var reqWindowSubTitle=(val.hasOwnProperty('windowSubTitle'))?val['windowSubTitle']:false;
            var reqEventReturn=(val.hasOwnProperty('returnData'))?val['returnData']:true;
            var reqEventWindow=(val.hasOwnProperty('raiseWindow'))?val['raiseWindow']:false;
            var reqEventWindowID=(val.hasOwnProperty('raiseWindowID'))?val['raiseWindowID']:false;
            var reqEventWaitCB=(val.hasOwnProperty('waitCallback'))?val['waitCallback']:false;
            var reqEventComplete=(val.hasOwnProperty('onComplete'))?val['onComplete']:null;
            var reqEventReturnObj=(val.hasOwnProperty('returnObject'))?val['returnObject']:null;
            var reqCancelWindow=(val.hasOwnProperty('onCancelWindow'))?val['onCancelWindow']:null;
            var reqRepeatOnError=(val.hasOwnProperty('repeatFunction'))?val['repeatFunction']:false;
            var reqDisableInit=(val.hasOwnProperty('disableInitiator'))?val['disableInitiator']:false;

            var currentServer=(val.hasOwnProperty('server'))?val['server']:XWF.connServer;
            var currentObject=(val.hasOwnProperty('query'))?val['query']:XWF.connQueryObject;
            var currentData=(val.hasOwnProperty('data'))?val['data']:XWF.connQueryData;

            if(XWF.connServerMethod=='url')
                XWF.privateConnResultUrl=currentServer+'?'+FBObjectToPost(currentObject);

            if(reqEventWaitCB){
                FBAppendLoadingOverlay();
            }

            // -------------------------------------------------------------------
            // If data object is some function then we try to return value from it
            var sendingData={};
            if(typeof currentData==='function'){
                sendingData=currentData();
            }
            // If data object is just an object we send it as is
            else {
                sendingData=currentData;
            }
            // -------------------------------------------------------------------

            if (window.XMLHttpRequest) {
                var xhr = new XMLHttpRequest();
                FBXHRPostData( xhr, XWF.privateConnResultUrl, sendingData, function(response)
                {
                    var window=null;
                    var result={window:null,content:null,title:null,data:null};
                    // -------------------------------------------------------------------
                    // If event need to return some data object which not belong to callback
                    if(reqEventReturnObj!=null){
                        result['object'] = reqEventReturnObj;
                    }

                    // -------------------------------------------------------------------
                    // Define is event need to return data to next functions
                    if(reqEventReturn){
                        var ret=FBXHRCallbackResponse(response);
                        if(ret!=null)
                            result['data']=ret;
                        else
                            result['data']={};
                    }
                    // -------------------------------------------------------------------

                    // Raise Window Procedure Requested
                    if(reqEventWindow){

                        window=FBOpenWindowView({raiseWindowID:reqEventWindowID,cancelWindowEv:reqCancelWindow,raiseWindowClass:reqAddClass,reqBackBar:reqBackBar,reqTitle:reqChangeTitle,reqSubTitle:reqWindowSubTitle});
                        result['window']=window['frame'];
                        result['content']=window['content'];
                        result['title']=window['title'];

                        if(XWF.defaultContainer==null) {
                            document.body.appendChild(window['frame']);
                        } else {
                            var container=document.getElementById(XWF.defaultContainer);
                            container.appendChild(window['frame']);
                        }

                        setTimeout(function(){
                            csstext=result.content.style.cssText;
                            result.content.setAttribute('style',csstext+' -webkit-overflow-scrolling:touch;');
                        },500);
                    }

                    if(XWF.privateViewLoadingOverlay!=null)
                    {
                        XWF.privateViewLoadingOverlay.parentNode.removeChild(XWF.privateViewLoadingOverlay);
                        XWF.privateViewLoadingOverlay=null;
                    }

                    // Check if some API did return error
                    if (result['data'].hasOwnProperty($apiVars.error) && result['data'][$apiVars.error] > 0) {

                        // Give a chance to error handler have little work
                        if(typeof XWF.connOnError==='function'){

                            var repeatStack=function()
                            {
                                if(XWF.connServerMethod=='url')
                                    XWF.privateConnResultUrl=currentServer+'?'+FBObjectToPost(currentObject);
                                XWF.send({
                                    windowClass:reqAddClass,navigationBar:reqBackBar,changeTitle:reqChangeTitle,
                                    windowSubTitle:reqWindowSubTitle,returnData:reqEventReturn,raiseWindow:reqEventWindow,
                                    raiseWindowID:reqEventWindowID,waitCallback:reqEventWaitCB,onComplete:reqEventComplete,
                                    onCancelWindow:reqCancelWindow,disableInitiator:reqDisableInit,returnObject:reqEventReturnObj,
                                    server:currentServer,query:currentObject,data:currentData
                                });
                            };

                            XWF.connOnError(result,result['data'][$apiVars.error],result['data'][$apiVars.errorMessage],repeatStack);
                        }
                        else
                        {

                            // Or execute on complete function if error handler isn't there
                            // Include onErrorRepeat Function
                            if(typeof reqRepeatOnError==='function'){
                                result['repeat']=reqRepeatOnError;
                            }
                            // Execute onComplete function
                            if(typeof reqEventComplete==='function'){
                                reqEventComplete(result);
                            }
                        }

                    }
                    // If no error returns just try to continue
                    else {

                        // Include onErrorRepeat Function
                        if(typeof reqRepeatOnError==='function'){
                            result['repeat']=reqRepeatOnError;
                        }
                        // Execute onComplete function
                        if(typeof reqEventComplete==='function'){
                            reqEventComplete(result);
                        }

                    }

                },false,XWF.connEarlyTermination);
            }
        };

        this.openwindow = function(val){

            var reqEventWindowID=(val.hasOwnProperty('raiseWindowID'))?val['raiseWindowID']:false;
            var reqBackBar=(val.hasOwnProperty('navigationBar'))?val['navigationBar']:true;
            var reqAddClass=(val.hasOwnProperty('windowClass'))?val['windowClass']:true;
            var reqChangeTitle=(val.hasOwnProperty('changeTitle'))?val['changeTitle']:false;
            var reqWindowSubTitle=(val.hasOwnProperty('windowSubTitle'))?val['windowSubTitle']:false;
            var reqCancelWindow=(val.hasOwnProperty('onCancelWindow'))?val['onCancelWindow']:null;

            var openWindow=FBOpenWindowView({raiseWindowID:reqEventWindowID,cancelWindowEv:reqCancelWindow,raiseWindowClass:reqAddClass,reqBackBar:reqBackBar,reqTitle:reqChangeTitle,reqSubTitle:reqWindowSubTitle});
            if(XWF.defaultContainer==null) {
                document.body.appendChild(openWindow['frame']);
            } else {
                var container=document.getElementById(XWF.defaultContainer);
                container.appendChild(openWindow['frame']);
            }

            setTimeout(function(){
                csstext=openWindow.content.style.cssText;
                openWindow.content.setAttribute('style',csstext+' -webkit-overflow-scrolling:touch;');
            },500);

            return openWindow;

        };

        this.closewindow = function(win){

            FBCloseWindowView(win);

        };

        this.removewindows = function(){

            winObj=XWF.privateViewQueue.slice(0);
            for(var k in winObj){

                if(winObj.hasOwnProperty(k)){
                    cur=winObj[k];
                    //console.log(cur);
                    frm=document.getElementById(cur.id);
                    if(frm!=null){
                        frm.parentNode.removeChild(frm);
                    }
                    //arrayRemove(XWF.privateViewQueue,k);
                }

            }
            XWF.privateViewQueue=[];
            XWF.privateViewCurrentIndex=null;
            XWF.privateViewCurrent=null;

        };

    };

    function FBXHRCallbackResponse(data){

        try {
            data = JSON.parse(data);
        } catch (e) {
            data = null;
        }

        if(data!=null){

            if(data[$apiVars.notify]){
                if($apiVars.notifyTimer in data){
                    FBNotify({message:data[$apiVars.notifyMessage],destroy:data[$apiVars.notifyTimer]});
                } else {
                    FBNotify({message:data[$apiVars.notifyMessage]});
                }
            }

        }

        return data;
    }

    /* ----------------------------------------------------
    >------         OPEN VIEW WINDOW                ------<
    ------------------------------------------------------*/
    function FBOpenWindowView(values)
    {

        var win,id,header,headerTitle,content,title,backBarEx=false,headerEx=false,touchEnabled=true;

        win = document.createElement('div');
        win.className = 'xwf_view xwf_view_background xwf_window xwf_visible xwf_slideInLeft';

        if(values.raiseWindowClass){
            win.className += ' '+values.raiseWindowClass;
        }
        if(values.touchEnabled){
            touchEnabled=values.touchEnabled;
        }

        var curDate=new Date();
        timeId=curDate.getDate()+''+curDate.getHours()+''+curDate.getMinutes()+''+curDate.getSeconds()+''+ curDate.getMilliseconds();

        if(values.raiseWindowID){
            win.setAttribute('id',values.raiseWindowID);
            id=values.raiseWindowID;
        } else {
            win.setAttribute('id','view' + timeId);
            id='view' + timeId;
        }

        if(XWF.defaultContainer==null) {

            currentHeight = window.innerHeight;
            currentWidth = window.innerWidth;
            var zIndex=(XWF.privateViewQueue.length)*2;
            win.style.zIndex = (zIndex>0)?zIndex:1;

        } else {
            container=document.getElementById(XWF.defaultContainer);
            currentHeight = container.offsetHeight;
            currentWidth = container.offsetWidth;
        }

        win.style.height = currentHeight + 'px';
        win.style.width = currentWidth + 'px';



        header = document.createElement('div');
        header.className = 'xwf_window_header';
        header.style.height=XWF.defaultHeaderHeight+'px';

        headerTitle = document.createElement('div');
        headerTitle.className = 'xwf_window_header_title';
        if(values.reqTitle){
            headerTitle.innerHTML = values.reqTitle;
        }
        header.appendChild(headerTitle);
        headerEx=true;

        currentHeight-=XWF.defaultHeaderHeight;


        win.appendChild(header);

        if(values.reqBackBar)
        {

            var backBar=null;
            if(values.reqSubTitle)
                backBar=cineBoxFnRestoMenuBack(values.cancelWindowEv,values.reqSubTitle);
            else
                backBar=cineBoxFnRestoMenuBack(values.cancelWindowEv);

            backBar.style.height=XWF.defaultNavBarHeight+'px';
            currentHeight-=XWF.defaultNavBarHeight;

            win.appendChild(backBar);
            backBarEx=true;

        }

        content = document.createElement('div');
        content.className = 'xwf_window_content';
        content.style.height = currentHeight+'px';

        var append = function(node){

                if(node.nodeType==1){
                    this.appendChild(node);
                }

        }.bind(content);

        win.appendChild(content);

        if(values.touchEnabled) {
            win.addEventListener('touchstart', function (e) {
                FBTouchWindow(e);
            });
            win.addEventListener('touchmove', function (e) {
                FBTouchWindowMove(e, this);
            }.bind(win));
            win.addEventListener('touchend', function (e) {
                FBTouchWindowEnd(e, this);
            }.bind({w: win, c: content}));
        }

        if(XWF.sysRefreshWinContentOnScroll) {
            content.addEventListener('scroll', function (e) {
                var cont = this;
                if (XWF.sysRefreshWCTimer != null) {
                    clearTimeout(XWF.sysRefreshWCTimer);
                }
                XWF.sysRefreshWCTimer = setTimeout(function () {

                    cont.style.display = 'none';
                    cont.offsetHeight;
                    cont.style.display = 'block';
                    cont.offsetHeight;

                }, 200);

            }.bind(content));
        }

        XWF.privateViewQueue.push({id:id,window:win,event:null,xhr:null,content:content,withHeader:headerEx,withBackBar:backBarEx});
        XWF.privateViewCurrent=win;
        XWF.privateViewCurrentIndex=XWF.privateViewQueue.length-1;

        return {append:append,frame:win,content:content,title:headerTitle,header:header};

    }

    var wtouches={};
    var wcursorX=0;
    var wcursorLX=0;
    var wcursorDX=0;

    var wcursorDistance=0;
    var wcursorLastDist=0;

    function pixelToInteger(t){var r=/[(px+)(%+)]+/g;return parseInt(t.replace(r,''));}

    function FBTouchWindow(e)
    {
        wcursorLastDist=0;
        wcursorDistance=0;
        wcursorLX=0;
        wcursorDX=0;
        var touches = e.changedTouches;

        for(var t=0;t<touches.length;t++){
            wtouches[touches[t].identifier]={
                pageX:touches[t].pageX,
                pageY:touches[t].pageY
            };
        }
    }

    function FBTouchWindowMove(e,w)
    {
        var touches = e.changedTouches;
        var dx=0,nx=0,x=0;
        for(var t=0;t<touches.length;t++)
        {
            var wt=wtouches[touches[t].identifier];
            x=wt.pageX;
            nx=touches[t].pageX;
            dx=Math.abs(nx-x);
        }
        wcursorDistance+=dx-wcursorLastDist;
        wcursorLastDist=dx;

        if(Math.abs(wcursorDistance)>50 && dx>wcursorDX)
        {
            cl=pixelToInteger(getComputedStyle(w).getPropertyValue('left'));
            w.style.left=(cl+(wcursorDistance/2))+'px';

            if(wcursorDistance>=160){
                FBCloseWindowView();
                wcursorDistance=0;
                return true;
            }
            e.preventDefault();

        } else {
            return true;
        }

        wcursorLX=x;
        wcursorDX=dx;

    }

    function FBTouchWindowEnd(e,w){
        if(wcursorDistance<160){
            w.w.style.left=0;
        }
    }

    function FBCloseWindowView(w){
        var element,elementIndex,elementObject;

        if(typeof w==="undefined" && XWF.privateViewCurrent!=null)
        {

            element=XWF.privateViewCurrent;
            elementIndex=XWF.privateViewCurrentIndex;
            elementObject=XWF.privateViewQueue[elementIndex];

            arrayRemove(XWF.privateViewQueue,elementIndex);
            windowsCount=XWF.privateViewQueue.length;

            if(windowsCount==0)
            {

                XWF.privateViewCurrent=null;
                XWF.privateViewCurrentIndex=null;
                if(XWF.defaultView!=null){

                    initialView=document.getElementById(XWF.defaultView);
                    if(initialView!=null){
                        initialView.style.display='block';
                    }

                }

            } else {

                newIndex=windowsCount-1;
                newElementObject=XWF.privateViewQueue[newIndex];
                newWindowToShow=document.getElementById(newElementObject.id);

                if(newWindowToShow!=null){

                    XWF.privateViewCurrent=newWindowToShow;
                    XWF.privateViewCurrentIndex=newIndex;

                }

            }

            element.className+=" xwf_slideOutRight";
            setTimeout(function()
            {
                this.parentNode.removeChild(this);
            }.bind(element),600);

        }
        else
        {

        }
    }

    function cineBoxFnRestoMenuBack(ev,title){

        var n,i;

        n=document.createElement('div');
        n.className = 'xwf_window_bar';
        i=document.createElement('div');
        i.className = 'xwf_window_bar_bb';
        i.innerHTML = '<div class="xwf_window_bar_bbb"></div>Back';
        i.addEventListener('click',function(e){

            if(typeof this==='function')
            {
                this();
            }
            FBCloseWindowView();

        }.bind(ev));
        n.appendChild(i);

        if(typeof title!=='undefined'){
            i=document.createElement('div');
            i.className = 'xwf_window_bar_title';
            i.innerHTML = title;
            n.appendChild(i);
        }

        return n;

    }

    function FBAppendLoadingOverlay(){

        var scr = document.createElement('div');
        scr.className = 'xwf_loadingOverlay';

        var spinner = document.createElement('div');
        spinner.className = 'xwf_loadingOverlaySpin';
        spinner.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
        scr.appendChild(spinner);

        document.body.appendChild(scr);
        XWF.privateViewLoadingOverlay=scr;

    }

    function FBXHRPostData(xhr,url,data,callback,iterateValue,earlyTerminate){

        var timeout=null;

        if(XWF.connServer != null){

            var type = (XWF.connQueryMethod!=null)?XWF.connQueryMethod.toUpperCase():'POST';
            if(type=='POST' || type=='UPDATE' || type=='DELETE')
            {

                xhr.open(type,url,true);
                xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                xhr.setRequestHeader("X-Requested-With","XMLHttpRequest");

                // Timeout counter
                // NEED TO SET FOR NON EARLY TERMINATION
                if(earlyTerminate) {
                    timeout = setTimeout(function () {
                        FBNotify({message:"Connection timed out"});
                        xhr.abort();
                        clearInterval(iterateValue);
                        if(XWF.privateViewLoadingOverlay!=null)
                        {
                            XWF.privateViewLoadingOverlay.parentNode.removeChild(XWF.privateViewLoadingOverlay);
                            XWF.privateViewLoadingOverlay=null;
                        }
                    }.bind(xhr), 3000);
                }

                xhr.onreadystatechange = function()
                {
                    if (xhr.readyState == 4 && xhr.status == 200)
                    {
                        if(xhr.status == 200)
                        {
                            // Clear timers
                            clearInterval(iterateValue);
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
                            if(XWF.privateViewLoadingOverlay!=null)
                            {
                                XWF.privateViewLoadingOverlay.parentNode.removeChild(XWF.privateViewLoadingOverlay);
                                XWF.privateViewLoadingOverlay=null;
                            }
                        }
                    }
                };

                if(iterateValue==false)
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
                                FBXHRPostData(nxhr,url,data,callback,inval,earlyTerminate);
                            },5000);
                            XWF.privateConnPendingRequests.push(url);
                            XWF.privateConnIterator=1;
                        }
                    };
                }

                if(typeof data === 'object')
                    data = FBObjectToPost(data);
                xhr.send(data);

                XWF.connEarlyTermination=true;
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

    function FBNotify(data){

        var l,i,c,b,a;

        if(XWF.privateNotifications!=null){
            l=XWF.privateNotifications;
            if(!document.body.contains(l)){
                l=document.createElement('div');
                l.className='c_notify_layer';
                XWF.privateNotifications=l;
                document.body.appendChild(l);
            }
        } else {
            l=document.createElement('div');
            l.className='c_notify_layer';
            XWF.privateNotifications=l;
            document.body.appendChild(l);
        }

        i=document.createElement('div'); i.className='c_notify_i';

        c=document.createElement('div'); c.className='c_notify_i_c';
        c.innerHTML = data.message;

        b=document.createElement('div'); b.className='c_notify_i_b';
        a=document.createElement('button'); a.className='c_notify_b_b';
        a.innerHTML = '<div class="fa fa-times" style="margin-left:-20px"></div>';
        a.addEventListener('click',function(e){FBNotifyClose(e,this)}.bind({notify:l,item:i}));

        if('destroy' in data){
            var d=data['destroy'];
            if(d>0){
                setTimeout(function(e){FBNotifyClose(e,this)}.bind({notify:l,item:i}),d*1000);
            }
        }

        b.appendChild(a);
        i.appendChild(c);
        i.appendChild(b);

        l.appendChild(i);

    }

    function FBNotifyClose(e,o){

        var i = o.item;
        var l = o.notify;
        if(document.body.contains(l)){
            l.removeChild(i);
            var c=l.childNodes;
            c= c.length;
            if(c<1){
                l.parentNode.removeChild(l);
                XWF.privateNotifications=null;
            }
        }

    }

    function arrayIndex(a,e){
       var l= a.length;for(var i=0;i<l;i++){if(a[i]===e)return {result:true,pos:i}}return false;
    }

    function arrayRemove(array, index) {
        var n = array.slice((index) + 1 || array.length);
        array.length = index < 0 ? array.length + index : index;
        return array.push.apply(array,n);
    }

    window.addEventListener("resize", function () {

        var w= 0,h=0;

        if(XWF.defaultContainer==null) {
            w=window.innerWidth;
            h=window.innerHeight;
        } else {
            var container=document.getElementById(XWF.defaultContainer);
            w=container.offsetWidth;
            h=container.offsetHeight;
        }

        XWF.windowHeight=h;
        XWF.windowWidth=w;

        var winHeader=XWF.defaultHeaderHeight;
        var winBack=XWF.defaultNavBarHeight;

        var windows=XWF.privateViewQueue;
        var wlen=windows.length;
        var i=0;

        for(i;i<wlen;i++)
        {
            newh=h;
            cur=windows[i];
            cur.window.style.width=w+'px';
            cur.window.style.height=h+'px';
            if(cur.withHeader){
                newh-=winHeader;
            }
            if(cur.withBackBar){
                newh-=winBack;
            }
            cur.content.style.height=newh+'px';
        }

        //var o=document.getElementsByClassName('xwf_view');
        //var l=o.length;

        //for(i=0;i<l;i++){

        //}

    });

    if(!window.XWF){window.XWF = $cine();}
})();