var mongoose = require('mongoose');
var express = require('express')
var cors = require('cors')
const path = require('path')
const http = require('http')
var bodyparser = require('body-parser')
var Question = require('./models/question.js')
var Answer = require('./models/answer.js')
var User = require('./models/user.js')

mongoose.connect('mongodb://localhost/stack_overflow', { useNewUrlParser: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('connected');
});


var app = express();
app.use(express.static(path.join(__dirname, 'dist/StackOverflow')));
app.use(cors())
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.post('/authenticate', async (req, res) => {
    const { emailID, password } = req.body;
    user = await User.findOne({ emailID: emailID, password: password })
    if (!user) return res.json({ status: 'Username or password is incorrect' });
    return res.json({
        status: 'Success',
        id: user.emailId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        token: 'fake-jwt-token'
    })
})

app.post('/register', async (req, res) => {
    console.log("Got request")
    let user = new User(req.body)

    let usr = await User.findOne({ emailID: user.emailID }).exec();
    if (usr) return res.json({ Status: 'Email Already in Use' })
    usr = await User.findOne({ username: user.username }).exec();
    if (usr) return res.json({ Status: 'Username Already Exists' })

    user.save()
    return res.json({ status: 'Success' })
})

app.post('/submitQuestion', (req, res) => {
    let ques = new Question(req.body)
    ques.save()
    return res.json({ status: 'Success' })
})

app.post('/submitAnswer', (req, res) => {
    let ans = new Answer(req.body)
    ans.save()
    return res.json({ status: 'Success' })
})

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/StackOverflow/index.html'));
});


const port = 3000;

const server = http.createServer(app);

server.listen(port, () => console.log('Running'))