const LineConnect = require('./connect');
var ttoken = require('./token.json');
let line = require('./main.js');
let LINE = new line();


const auth = {
 	authToken: ttoken["token"],
 	certificate: '',
	 email: '',
	 password: ''
}

let client =  new LineConnect(auth);

client.startx().then(async (res) => {
	let ops;
	while(true) {
		try {
			ops = await client.fetchOps(res.operation.revision);
            if (ops != null) {
               for (let op in ops) {
                   if(ops[op].revision.toString() != -1){
                       res.operation.revision = ops[op].revision;
                       LINE.poll(ops[op])
			        }
		        }
		    }
		} catch(error) {
			console.log('error',error)
		}
	}
});

