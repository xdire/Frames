# Frames
Frames javascript library for operations with windows on mobile devices or in desktop browsers

Simple to operate: 

Initiate with defaults:

XWF.connection({
    server:"https://api.myserver.com/",
    serverMethod:"url",
    eventOnError:function(){},
    queryObject:{
        param1:"order", param2:"subject", paramN:"something"
    },
    queryData:{
        postParam1:1, postParam2:2, postParamN:3
    }
});

And then in code

- Setup parameters which will pass to backend like ?param1=order&...
XWF.connQueryObject = {param1:"order", param2:"subject", paramN:"something"};

- Setup connection early termination, which gives you ability wait or not to wait for long response
XWF.connEarlyTermination = false;

- Setup data which you will send with post string
XWF.connQueryData = {
      ident: 0, lat: lat, long: lng, user: 0, date:odate, userdate:udate, usertz:utz, dayofweek:dayOfWeek, timestamp: timeStamp
};

- Then send data whit parameteres
XWF.send({
    raiseWindow: false,
    onComplete: function(){},
    returnObject: {}
});

Or with new window open in window queue

XWF.send({
    navigationBar:true,
    waitCallback:true,
    raiseWindow:true,
    raiseWindowID:"DOM_ID",
    windowClass:'CSSCLASS',
    onComplete:function(){},
    changeTitle:"SomeTitle",
    windowTitle:"SomeSubTitle"
  });
