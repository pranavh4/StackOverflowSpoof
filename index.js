if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}


var mongoose = require('mongoose');
var express = require('express')
var cors = require('cors')
const path = require('path')
const http = require('http')
var bodyparser = require('body-parser')
var Question = require('./models/question.js')
var Answer = require('./models/answer.js')
var User = require('./models/user.js')
const initializePassport = require('./passport-config')
const passport = require('passport')
const session = require('express-session')
var cookieParser = require('cookie-parser')

mongoose.connect('mongodb://localhost/stack_overflow', { useNewUrlParser: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('connected');
});

async function getUserByEmail(email) {
    let user = await User.findOne({ email: email }).exec()
    return user
}

async function getUserById(id) {
    let user = await User.findById(id)
    return user
}

initializePassport(
    passport,
    getUserByEmail,
    getUserById
)

let generateKeywords = str => {
    let stopwords = ['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now']
    let words = str.toLowerCase().split(' ')
    let keywords = []
    for (i = 0; i < words.length; i++) {
        if (!stopwords.includes(words[i]))
            keywords.push(words[i])
    }
    return keywords
}



var app = express();
app.use(express.static(path.join(__dirname, 'dist/StackOverflow'), { index: false }));
app.use(cors({
    origin: [
        "http://localhost:4200"
    ], credentials: true
}));
app.use(cookieParser(process.env.SESSION_SECRET))
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}))
app.use(passport.initialize())
app.use(passport.session())

app.post('/authenticate', async (req, res) => {
    const { email, password } = req.body;
    user = await User.findOne({ email: email, password: password }).exec()
    if (!user) return res.json({ status: 'Username or password is incorrect' });
    return res.json({
        status: 'Success',
        id: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
    })
})

// app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
//     successRedirect: '/',
//     failureRedirect: '/login'
// }))

app.post('/login', checkNotAuthenticated, function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        console.log(req.body)
        if (err) { return next(err); }
        if (!user) {
            return res.json({ status: "Failure" }, ...info);
            // console.log("Error logging in")
            // return res.redirect('/login')
        }
        req.login(user, function (err) {
            if (err) { return next(err); }
            return res.json({ user: user, status: "Success" });
            // console.log("Logged in")
            // return res.redirect('/')
        });
    })(req, res, next);
});

app.post('/register', async (req, res) => {
    console.log("Got request")
    let user = new User(req.body)
    console.log(req.body);
    let usr = await User.findOne({ email: user.email }).exec();
    if (usr) return res.json({ status: 'An Account With this Email Already Exists, Please Log in' })
    usr = await User.findOne({ username: user.username }).exec();
    if (usr) return res.json({ status: 'Username Already Exists' })

    user.save()
    return res.json({ status: 'Success' })
})

app.post('/submitQuestion', (req, res) => {
    let ques = new Question({ ...req.body, keywords: generateKeywords(req.body.heading), upvotes: 0, downvotes: 0 })
    ques.save()
    return res.json({ status: 'Success' })
})

app.post('/submitAnswer', (req, res) => {
    let ans = new Answer({ ...req.body, upvotes: 0, downvotes: 0 })
    ans.save()
    return res.json({ status: 'Success' })

})

app.get('/getPost', async (req, res) => {
    let { questionID } = req.query
    let ans = await Answer.find({ questionID: questionID }).sort({ upvotes: -1 }).exec()
    let ques = await Question.findById(questionID)
    return res.json({ status: "Success", question: ques, answers: ans })
})

app.get('/findQuestions', async (req, res) => {
    let { queryString } = req.query
    // console.log(req.query)
    let words = generateKeywords(queryString)
    let ques = await Question.find({ keywords: { $in: words } }).exec()
    return res.json({ status: "Success", questions: ques })
    // console.log(ques)
})

// app.get('/', checkAuthenticated, (req, res) => {
//     res.sendFile(path.join(__dirname, 'dist/StackOverflow/index.html'));
// })

app.get('/currentUser', async (req, res) => {
    let user = await req.user
    console.log(req.cookies)
    return res.json(user)
})

app.get('/getUserQuestions', async (req, res) => {
    let username = req.query.username
    let ques = await Question.find({ user: username }).sort({ upvotes: -1 }).exec()
    let ans = await Answer.find({ user: username })
    ans = ans.map(a => a.questionID)
    console.log(ans)
    let q_ans = await Question.find({ _id: { $in: ans } }).exec()
    return res.json({ askedQuestions: ques, answeredQuestions: q_ans })
})


app.get('/login', checkNotAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/StackOverflow/index.html'));
});

app.get('*', checkAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/StackOverflow/index.html'));
});


const port = 3000;

const server = http.createServer(app);

server.listen(port, () => console.log('Running'))

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        console.log("Authenticated")
        return next()
    }
    console.log("not authenticated")
    return res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
    console.log(req.isAuthenticated())
    if (req.isAuthenticated()) {
        console.log("authed")
        return res.redirect('/')
    }
    next()
}