module.exports=function(root,cb) {
    var fs=require('fs');
    var jwt_decode=require('jwt-decode');
    fs.readFile(root + "/.login",'utf-8', function (e, s) {
        if (e) return cb(false);
        if (s) {
            try {
            var response=jwt_decode(s);
            } catch(e) {
                return cb(false);
            };
            cb(response);
        }
    });
};