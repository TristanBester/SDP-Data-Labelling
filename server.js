if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
const express = require('express')
const path = require('path')
const authRoute = require('./routes/auth')
const protectedRoute = require('./routes/protected')
const unprotectedRoute = require('./routes/unprotected')
const flash = require('express-flash')
const session = require('express-session')
const passport = require('passport')
const app = express()
const mongoose = require('mongoose')
const methodOverride = require('method-override')
const fs = require('fs')
const googleService = require('./googleServices')
const { checkAuthenticated } = require('./middleware/auth.mw')
const Labelling = require('./models/Labelling')
const LabellingFragment = require('./LabellingFragment')
const Job = require('./models/Job')

async function bruh(jobId, numLabellers, imgUrlArr) {
    const fragmentArr = []
    const imgUrls = imgUrlArr
    const equalAmount = Math.floor(imgUrls.length / numLabellers)
    var currentUrl = 0
    for (let i = 0; i < numLabellers; i++) {
        let imgFragment
        if (i == numLabellers - 1) {
            imgFragment = imgUrls.slice(currentUrl)
        } else {
            imgFragment = imgUrls.slice(currentUrl, currentUrl + equalAmount)
            currentUrl += equalAmount
        }

        const fragment = new LabellingFragment(null, imgFragment)
        fragmentArr.push(fragment.getFragment())
    }
    const labelling = new Labelling({
        jobId: jobId,
        labellersArr: fragmentArr
    })

    await labelling.save()
}
// bruh('bruh', 6, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'])

if (!fs.existsSync('public/uploads')) {
    fs.mkdirSync('public/uploads')
}

const gDriveFolderId = '14yJctoyNoX6ivWJre9dXLLgbUVnNRvpZ' //make environment variable

const service = new googleService()

//port and path
const staticPath = path.join(__dirname, 'public')
const port = process.env.PORT || 3000

//use ejs and static files
app.set('view engine', 'ejs')
app.use(express.static(staticPath))
app.use(express.urlencoded({ extended: false }))

//connect to mongodb
async function connectDB() {
    try {
        await mongoose.connect(
            process.env.DB_CONNECT,
            {
                useUnifiedTopology: true,
                useNewUrlParser: true,
                useFindAndModify: false,
                useCreateIndex: true
            },
            () => console.log('connected to db!')
        )
    } catch (error) {
        console.log(error)
    }

    //safety starts
    mongoose.connection.on('error', (err) => {
        console.log(err)
    })
    //end of safety
}
connectDB()

//middleware
app.use(methodOverride('_method'))
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
    })
)
app.use(flash())

//initialise passport
app.use(passport.initialize())
app.use(passport.session())

protectedRoute.all(checkAuthenticated)

//routes
app.use('', authRoute)
app.use('', protectedRoute)
app.use('', unprotectedRoute)

//server listen
app.listen(port, () => {
    console.log(`server started on port ${port}`)
})
