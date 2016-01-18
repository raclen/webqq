/**
 * Created by dixiao on 2016/1/4.
 */
var request = require("request");
var express = require('express');
var app = express();
var fs = require('fs');
var jar = request.jar();
var app_port = process.env.VCAP_APP_PORT || 3000;
var http = require('http').Server(app);
app.use(express.static(__dirname + '/public'));

var UA = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9A334 Safari/7534.48.3",
    "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)",
    "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6; en-US) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
    "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.94 Safari/537.36",
    "Mozilla/5.0 (Windows NT 6.2; WOW64; rv:21.0) Gecko/20100101 Firefox/21.0",
    "Mozilla/5.0 (Linux; U; Android 4.0.4; en-gb; GT-I9300 Build/IMM76D) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30"
];
function randomUA(){
    var n=Math.floor(Math.random()*UA.length+1)-1;
    return UA[n]
}

//console.log(UA[n])
var defOptions = {
    //proxy: "http://127.0.0.1:8888",	//for fiddler
    url: '',
    encoding: "utf-8",
    headers: {
        "Connection": "keep-alive",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
       // 'cookie':'userid=123456; mycookie2=abcdefg',
        "Accept-Encoding": "gzip, deflate, sdch",
        "Accept-Language": "zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4",
        "User-Agent": randomUA()
    },
    json: true
};

//格式化cookies
function formatCookies(c) {
    var cookies = {};
    var pairs = c.split(/[;,] */);
    for (var i = 0; i < pairs.length; i++) {
        var idx = pairs[i].indexOf('=');
        var key = pairs[i].substr(0, idx);
        var val = pairs[i].substr(++idx, pairs[i].length).trim();
        cookies[key] = val;
    }
    return cookies;
}
var cookies={};
var cookiesStr="";
app.get('/ptqrshow', function (req, res, next) {
    var options=cloneObj(defOptions);
    var j = request.jar();
    var url = "https://ssl.ptlogin2.qq.com/ptqrshow?appid=501004106&e=0&l=M&s=5&d=72&v=4&t=0.4139144900254905";
    var referer = "https://ui.ptlogin2.qq.com/cgi-bin/login";
    options.url=url,options.jar=j,options.method= 'GET',options.headers.Referer=referer;
    console.log(options)
    request(options, function (error, response, body) {
        console.log(response.statusCode)
        if (!error && response.statusCode == 200) {
            var cookie_string = j.getCookieString(url);
            cookiesStr+=cookie_string+';';
            var item = {
                cookies: cookie_string,
                url: 'image/doodle.png'
            };
            res.send(item)
        }
    }).pipe(fs.createWriteStream('./public/image/doodle.png'));
});

function ptqrlogin(cookie){
    console.log(cookie);
    var j = request.jar();
    var options=cloneObj(options);

    var url = "https://ssl.ptlogin2.qq.com/ptqrlogin?webqq_type=10&remember_uin=1&login2qq=1&aid=501004106&u1=http%3A%2F%2Fw.qq.com%2Fproxy.html%3Flogin2qq%3D1%26webqq_type%3D10&ptredirect=0&ptlang=2052&daid=164&from_ui=1&pttype=1&dumy=&fp=loginerroralert&action=0-0-136435&mibao_css=m_webqq&t=undefined&g=1&js_type=0&js_ver=10139&login_sig=&pt_randsalt=0";
    options.url=url,options.jar=j,options.method= 'GET', options.headers.Cookie=cookie;
    options.headers.Host="ssl.ptlogin2.qq.com";
    options.headers["Upgrade-Insecure-Requests"]=1;
    console.log(options)
    request(options, function (error, response, body) {
        console.log(response.statusCode)
        if (!error && response.statusCode == 200) {
            var cookie_string = j.getCookieString(url);
            cookiesStr+=cookie_string+';';
            var temp = body.toString();
            console.log(temp);
            if (temp.indexOf("成功") > -1) {
                console.log(temp);
                var url = temp.split(',')[2];
                url = url.substring(1, url.length - 1);
                console.log(url);
                //再往下执行

            }
            else if (temp.indexOf("已失效") != -1) {
               console.log("验证码已失效")
            }else{
                ptqrlogin()
            }

        }
    });
}
function cloneObj(oldObj) { //复制对象方法
    if (typeof(oldObj) != 'object') return oldObj;
    if (oldObj == null) return oldObj;
    var newObj = new Object();
    for (var i in oldObj)
        newObj[i] = cloneObj(oldObj[i]);
    return newObj;
};
function extendObj() { //扩展对象
    var args = arguments;
    if (args.length < 2) return;
    var temp = cloneObj(args[0]); //调用复制对象方法
    for (var n = 1; n < args.length; n++) {
        for (var i in args[n]) {
            temp[i] = args[n][i];
        }
    }

    return temp;

}

app.get('/ptqrlogin', function (req, res, next) {
    var cookie =req.query.cookie;
    var options=cloneObj(defOptions);
    var j = request.jar();
    var url_ptqrlogin = "https://ssl.ptlogin2.qq.com/ptqrlogin?webqq_type=10&remember_uin=1&login2qq=1&aid=501004106&u1=http%3A%2F%2Fw.qq.com%2Fproxy.html%3Flogin2qq%3D1%26webqq_type%3D10&ptredirect=0&ptlang=2052&daid=164&from_ui=1&pttype=1&dumy=&fp=loginerroralert&action=0-0-136435&mibao_css=m_webqq&t=undefined&g=1&js_type=0&js_ver=10139&login_sig=&pt_randsalt=0";
    options.url=url_ptqrlogin,options.jar=j,options.method= 'GET', options.headers.Cookie=cookie;
    options.headers.Host="ssl.ptlogin2.qq.com";
    //console.log(options)
    request(options, function (error, response, body) {
        console.log(response.statusCode)
        if (!error && response.statusCode == 200) {
            var cookie_string = j.getCookieString(url_ptqrlogin);
            cookiesStr+=cookie_string+';';
            console.log(cookiesStr);
            cookies = extendObj({},formatCookies(cookie_string));
            var temp = body.toString();
            console.log(cookies);
            if (temp.indexOf("成功") > -1) {
                console.log(temp);
                var url2 = temp.split(',')[2];
                url2 = url2.substring(1, url2.length - 1);
                console.log(url2);
                //再往下执行
                check_sig(url2,res);
            }
            else if (temp.indexOf("已失效") != -1) {
                res.send({
                    statusCode: '0001',
                    statusMessage: '二维码已失效'
                })
            }

        }
    });
});

function check_sig(url,res){
    sleep(3000);
    var options=cloneObj(defOptions);
    var j = request.jar();
    var url_check_sig = url;
    options.url=url_check_sig,options.jar=j,options.method= 'GET', options.headers.Cookie=cookiesStr;
    options.headers.Host="ssl.ptlogin2.qq.com";
    request(options, function (error, response, body) {
        console.log(response.statusCode)
        if(response.statusCode==302){
            return;
        }
        if (!error && response.statusCode == 200) {
            var cookie_string = j.getCookieString(url_check_sig);
            cookiesStr+=cookie_string+';';
            cookies = extendObj(cookies,formatCookies(cookie_string));
            getvfwebqq(res)
        }
    });

}

function getvfwebqq(res){
    var options=cloneObj(defOptions);
    var j = request.jar();
    var url_getvfwebqq = 'http://s.web2.qq.com/api/getvfwebqq?ptwebqq='+cookies.ptwebqq+'&clientid=53999199&psessionid=&t=1446710396202';
    options.url=url_getvfwebqq,options.jar=j,options.method= 'GET', options.headers.Cookie=cookiesStr;
    options.headers.Referer="http://s.web2.qq.com/proxy.html?v=&callback=1&id=1";
    delete options.headers.Host;
    console.log(options);
    request(options, function (error, response, body) {
        console.log("getvfwebqqCode="+response.statusCode)
        if (!error && response.statusCode == 200) {
            console.log(body);
        /*    { retcode: 0,
                result: { vfwebqq: 'c52e6687d5a11be1bdbe05454f0fab04a488d9edf31100c7b65add4e23
                be3c3eb4f54996c1204ce9' } }*/
            console.log(typeof body);
            var vfwebqq =body.result.vfwebqq;
            cookies = extendObj(cookies,{vfwebqq:vfwebqq});
            console.log(cookies);
            login2(res);
        }
    });

}
function login2(res){
    var options=cloneObj(defOptions);
    var j = request.jar();
    options.headers.Host="d1.web2.qq.com";
    options.headers.Origin="http://d1.web2.qq.com";
    options.headers.Expect ="100-continue";
    options.headers["Content-Type"]="application/x-www-form-urlencoded";
    var url_login2 = 'http://d.web2.qq.com/channel/login2';
    options.url=url_login2,options.jar=j,options.method= 'POST', options.headers.Cookie=cookiesStr;
    options.headers.Referer="http://d.web2.qq.com/proxy.html?v=20130916001&callback=1&id=2";
    options.form={r:JSON.stringify({"ptwebqq":cookies.ptwebqq,"clientid":53999199,"psessionid":"","status":"online"})};
    console.log(options);
    request(options, function (error, response, body) {
        console.log("login2="+response.statusCode)
        if (!error && response.statusCode == 200) {
            console.log("login2body的类型==="+Object.prototype.toString.call(body));
            console.log(body);
            var cookie_string = j.getCookieString(url_login2);
            cookiesStr+=cookie_string+';';
            console.log("login2Cokkies==="+cookie_string);
            cookies = extendObj(cookies,formatCookies(cookie_string));
            send_qun_msg2(body)
        }
    });
}
//睡眠函数
function sleep(milliSeconds) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds);
}
/*
登陆后的返回值
var t = {
    "result": {
        "cip": 23600812,
        "f": 0,
        "index": 1075,
        "port": 47450,
        "psessionid": "8368046764001d636f6e6e7365727665725f77656271714031302e3133332e34312e383400001ad00000066b026e040015808a206d0000000a406172314338344a69526d0000002859185d94e66218548d1ecb1a12513c86126b3afb97a3c2955b1070324790733ddb059ab166de6857",
        "status": "online",
        "uin": 2275025,
        "user_state": 0,
        "vfwebqq": "59185d94e66218548d1ecb1a12513c86126b3afb97a3c2955b1070324790733ddb059ab166de6857"
    }, "retcode": 0
}
*/

//发送qq消息
function send_qun_msg2(res){
    var options=cloneObj(defOptions);
    var j = request.jar();
    var url_register = 'http://d1.web2.qq.com/channel/send_qun_msg2';
    options.url=url_register,options.jar=j,options.method= 'POST', options.headers.Cookie=cookiesStr;
    options.headers.Referer="http://d1.web2.qq.com/proxy.html?v=20151105001&callback=1&id=2";
    options.headers.Host="d1.web2.qq.com";
    options.headers["Content-Type"]="application/x-www-form-urlencoded";
    var msg = {"group_uin":749835943,"content":"[\"我明白了\",[\"font\",{\"name\":\"宋体\",\"size\":10,\"style\":[0,0,0],\"color\":\"000000\"}]]","face":543,"clientid":53999199,"msg_id":79370003,"psessionid":res.psessionid};
    options.form={r: JSON.stringify(msg)};
    console.log(options);
    request(options, function (error, response, body) {
        console.log("send_qun_msg2="+response.statusCode)
        if (!error && response.statusCode == 200) {
            console.log(JSON.stringify(body));
        }
    });
}


var server = http.listen(app_port, function (req, res) {
    console.log('Listening on port %d', server.address().port);
});

