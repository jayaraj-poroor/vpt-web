
var fs = require("fs"),
    protobuf = require("node-protobuf");
var pb = new protobuf(fs.readFileSync("message.desc"));

var obj = {
    type: "URGENT",
    subType: "URGENT"
}
var buf = pb.serialize(obj, "ShelloidMessage") // you get Buffer here, send it via socket.write, etc.

buf = new Buffer([8,24,80,63,2]);
var newObj = pb.parse(buf, "ShelloidMessage") // you get plain object here, it should be exactly the same as obj
console.log(newObj);