var express = require('express');
var app = express();
const PORT = 4000;

app.get('routes/index.j', (req, res) =>{
    res.send()
})

app.listen(PORT,() => {
    console.log(`app listening on port : ${PORT}`);
})