const path = require('path');
const fs = require('fs');
const https = require('https');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDbStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const uniqid = require('uniqid');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const adminRoutes = require('./routes/admin');
const shopRouter = require('./routes/shop');
const loginRouter = require('./routes/login');
const errorController = require('./controllers/ErrorController');
const User = require('./models/user');

const app = express();

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-ulb7d.mongodb.net/${process.env.MONGO_DATABASE}?w=majority`;

const store = new MongoDbStore({
    uri: MONGODB_URI,
    collection: 'sessions',
});

const accessLogFile = fs.createWriteStream(
    path.join(__dirname, 'accessLog.log'),
    {
        flags: 'a',
    }
);

app.set('view engine', 'ejs');
app.set('views', 'views/ejs');

app.use(morgan('combined', { stream: accessLogFile }));
app.use(compression());
app.use(helmet());

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, uniqid() + '-' + file.originalname);
    },
});

const fileFilter = (req, file, cb) => {
    switch (file.mimetype) {
        case 'image/png':
        case 'image/jpg':
        case 'image/jpeg':
            cb(null, true);
        default:
            cb(null, false);
    }
};

// const privateKey = fs.readFileSync('./server.key');
// const certificate = fs.readFileSync('./server.cert;');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);

const csrfProtection = csrf();

app.use(
    session({
        secret: 'my secret',
        resave: false,
        saveUninitialized: false,
        store: store,
    })
);

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    res.locals.isLoggedIn = req.session.isLoggedIn
        ? req.session.isLoggedIn
        : false;
    res.locals.csrfToken = req.csrfToken();
    next();
});
//opensssl req -nodes -new -x509 -keyout server.key -out server.cert;
app.use((req, res, next) => {
    // throw new Error('Dummy')
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then((user) => {
            // throw new Error('Another Dummy')
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch((err) => {
            next(new Error(err));
        });
});

app.use('/admin', adminRoutes);
app.use(shopRouter);
app.use(loginRouter);

// app.use('/500', errorController.get500Error);
app.use('/', errorController.get404Error);

app.use((error, req, res, next) => {
    console.log('error', error);
    // res.redirect('/500')
    res.render('500', {
        docTitle: '500: Error',
        errorCss: true,
        path: '',
    });
});

mongoose
    .connect(MONGODB_URI, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    })
    .then(() => {
        // https
        //     .createServer({ key: privateKey, cert: certificate }, app)
        app.listen(process.env.PORT || 3000);
    })
    .catch((err) => {
        next(new Error(err));
    });
